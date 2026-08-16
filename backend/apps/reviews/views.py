from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Review, ReviewImage
from .serializers import ReviewSerializer, SellerResponseSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.filter(is_approved=True).select_related('user', 'product', 'service', 'service_request').prefetch_related('images')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        # فیلتر بر اساس محصول یا خدمت
        product_id = self.request.query_params.get('product')
        service_id = self.request.query_params.get('service')
        service_request_id = self.request.query_params.get('service_request')
        
        if product_id:
            qs = qs.filter(product_id=product_id)
        if service_id:
            qs = qs.filter(service_id=service_id)
        if service_request_id:
            qs = qs.filter(service_request_id=service_request_id)
        
        return qs

    def perform_create(self, serializer):
        product = serializer.validated_data.get('product')
        service = serializer.validated_data.get('service')
        service_request = serializer.validated_data.get('service_request')
        user = self.request.user

        is_verified = False
        if product:
            from orders.models import Order
            is_verified = Order.objects.filter(
                buyer=user, items__product=product, status='completed'
            ).exists()
        elif service:
            from services.models import ServiceRequest
            is_verified = ServiceRequest.objects.filter(
                buyer=user, service=service, status='completed'
            ).exists()
        elif service_request:
            is_verified = (service_request.buyer == user and service_request.status == 'completed')

        serializer.save(user=user, is_verified_purchase=is_verified, is_approved=True)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def respond(self, request, pk=None):
        """فروشنده پاسخ می‌دهد"""
        review = self.get_object()
        product = review.product
        service = review.service
        service_request = review.service_request

        is_seller = False
        if product and product.seller == request.user:
            is_seller = True
        elif service and service.provider == request.user:
            is_seller = True
        elif service_request and service_request.service.provider == request.user:
            is_seller = True

        if not is_seller:
            return Response({'error': 'فقط فروشنده می‌تواند پاسخ دهد'}, status=403)

        serializer = SellerResponseSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(response_date=timezone.now())
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        review = self.get_object()
        review.helpful_count += 1
        review.save(update_fields=['helpful_count'])
        return Response({'helpful_count': review.helpful_count})