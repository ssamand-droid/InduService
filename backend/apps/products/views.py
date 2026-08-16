from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from .models import (
    Category, Brand, TechnicalSpecification, Product,
    ProductImage, ProductDocument
)
from .serializers import (
    CategorySerializer, BrandSerializer, TechnicalSpecificationSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    ProductImageSerializer, ProductDocumentSerializer
)
from core.permissions import IsSeller, IsOwnerOrReadOnly
from rest_framework.permissions import IsAdminUser
from notification.services import create_notification

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'country']

class TechnicalSpecificationViewSet(viewsets.ModelViewSet):
    queryset = TechnicalSpecification.objects.all()
    serializer_class = TechnicalSpecificationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet جامع محصولات با قابلیت فیلتر پیشرفته
    """
    queryset = Product.objects.select_related('category', 'brand', 'seller')\
                              .prefetch_related('images', 'productspecificationvalue_set__specification')\
                              .filter(is_active=True, is_deleted=False)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'category__slug': ['exact'],
        'brand__slug': ['exact'],
        'product_type': ['exact'],
        'condition': ['exact'],
        'price': ['gte', 'lte'],
        'is_featured': ['exact'],
    }
    search_fields = ['name', 'description', 'sku', 'brand__name', 'category__name']
    ordering_fields = ['price', 'created_at', 'stock_quantity']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsSeller | permissions.IsAdminUser]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        # فیلتر بر اساس قیمت از query param (برای range)
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=False, methods=['get'])
    def my_products(self, request):
        """محصولات فروشنده جاری"""
        products = self.get_queryset().filter(seller=request.user)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_image(self, request, slug=None):
        """آپلود تصویر برای محصول-فروشنده یا ادمین"""
        product = self.get_object()
        if product.seller != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[^/.]+)')
    def delete_image(self, request, slug=None, image_id=None):
        """حذف تصویر محصول"""
        product = self.get_object()
        if product.seller != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_403_FORBIDDEN)
        try:
            image = product.images.get(id=image_id)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProductImage.DoesNotExist:
            return Response({'error': 'تصویر یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def toggle_active(self, request, slug=None):
        """ادمین: فعال/غیرفعال کردن محصول"""
        product = self.get_object()
        product.is_active = not product.is_active
        product.save(update_fields=['is_active'])
        return Response({
            'success': True,
            'message': f'محصول {"فعال" if product.is_active else "غیرفعال"} شد',
            'is_active': product.is_active,
        })

    def perform_create(self, serializer):
        product = serializer.save(seller=self.request.user)
        # اعلان به ادمین
        from notification.services import create_notification
        from users.models import User
        admins = User.objects.filter(role='admin')
        for admin in admins:
            create_notification(
                user=admin,
                type='product',
                title='🆕 محصول جدید',
                message=f'{self.request.user.full_name} محصول "{product.name}" را ثبت کرد.',
                link=f'/dashboard/admin/products'
            )

    def perform_update(self, serializer):
        product = serializer.save()
        if not self.request.user.is_staff:
            from notification.services import create_notification
            from users.models import User
            admins = User.objects.filter(role='admin')
            for admin in admins:
                create_notification(
                    user=admin,
                    type='product',
                    title='📝 محصول بروزرسانی شد',
                    message=f'{self.request.user.full_name} محصول "{product.name}" را ویرایش کرد.',
                    link=f'/dashboard/admin/products'
                )    