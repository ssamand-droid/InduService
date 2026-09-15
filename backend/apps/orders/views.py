from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from users.models import User
from .models import Order, OrderItem, MROWorkflowStep
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    MROStepSerializer
)
from core.permissions import IsBuyer, IsSeller
from rest_framework.permissions import IsAdminUser

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('buyer', 'seller').prefetch_related('items', 'mro_steps').all()
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        if self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Order.objects.none()

        # ادمین همه سفارشات را می‌بیند
        if user.role == 'admin' or user.is_staff:
            return Order.objects.select_related('buyer', 'seller').prefetch_related('items').all()

        # خریدار: سفارشات خودش
        if user.role == 'buyer':
            return Order.objects.filter(buyer=user).select_related('seller').prefetch_related('items')

        # فروشنده: سفارشاتی که برای او ثبت شده
        if user.role in ['seller', 'service_provider']:
            return Order.objects.filter(seller=user).select_related('buyer').prefetch_related('items')

        return Order.objects.none()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsSeller])
    def confirm(self, request, pk=None):
        """تایید سفارش توسط فروشنده"""
        order = self.get_object()
        if order.status != Order.OrderStatus.PENDING:
            return Response({'error': 'وضعیت سفارش قابل تایید نیست'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = Order.OrderStatus.CONFIRMED
        order.confirmed_at = timezone.now()
        order.save()
        return Response({'message': 'سفارش تایید شد.'})

    @action(detail=True, methods=['post'], permission_classes=[IsSeller])
    def ship(self, request, pk=None):
        """ثبت ارسال سفارش"""
        order = self.get_object()
        if order.status != Order.OrderStatus.CONFIRMED:
            return Response({'error': 'ابتدا باید سفارش تایید شود'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = Order.OrderStatus.SHIPPED
        order.shipped_at = timezone.now()
        order.save()
        return Response({'message': 'سفارش ارسال شد.'})

    @action(detail=True, methods=['post'], permission_classes=[IsBuyer])
    def deliver(self, request, pk=None):
        """تایید تحویل توسط خریدار"""
        order = self.get_object()
        if order.status != Order.OrderStatus.SHIPPED:
            return Response({'error': 'سفارش هنوز ارسال نشده است'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = Order.OrderStatus.DELIVERED
        order.delivered_at = timezone.now()
        order.save()
        return Response({'message': 'تحویل تایید شد.'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """تکمیل نهایی سفارش (بستن)"""
        order = self.get_object()
        if order.status != Order.OrderStatus.DELIVERED:
            return Response({'error': 'ابتدا باید تحویل تایید شود'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = Order.OrderStatus.COMPLETED
        order.completed_at = timezone.now()
        order.save()
        return Response({'message': 'سفارش تکمیل شد.'})

    @action(detail=True, methods=['post'], permission_classes=[IsSeller])
    def add_mro_step(self, request, pk=None):
        """افزودن مرحله MRO به سفارش (برای سفارشات خدماتی)"""
        order = self.get_object()
        serializer = MROStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(order=order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='mro-step/(?P<step_id>[^/.]+)')
    def update_mro_step(self, request, pk=None, step_id=None):
        """بروزرسانی وضعیت مرحله MRO"""
        order = self.get_object()
        try:
            step = order.mro_steps.get(id=step_id)
        except MROWorkflowStep.DoesNotExist:
            return Response({'error': 'مرحله یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MROStepSerializer(step, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('status') == MROWorkflowStep.StepStatus.COMPLETED:
            serializer.validated_data['completed_at'] = timezone.now()
        elif serializer.validated_data.get('status') == MROWorkflowStep.StepStatus.IN_PROGRESS:
            serializer.validated_data['started_at'] = timezone.now()
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsBuyer])
    def upload_receipt(self, request, pk=None):
        """آپلود رسید پرداخت توسط خریدار"""
        order = self.get_object()
        if order.buyer != request.user:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if 'receipt' not in request.FILES:
            return Response({'error': 'فایلی آپلود نشده'}, status=400)

        order.payment_receipt = request.FILES['receipt']
        order.save(update_fields=['payment_receipt'])
        return Response({'message': 'رسید پرداخت با موفقیت ثبت شد'})

    @action(detail=True, methods=['post'], permission_classes=[IsBuyer])
    def create_invoice(self, request, pk=None):
        order = self.get_object()
        if order.buyer != request.user:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if hasattr(order, 'invoice'):
            return Response({'error': 'فاکتور قبلاً ایجاد شده'}, status=400)

        service_request = getattr(order, 'service_request', None)
        commission_rate = Invoice.get_commission_rate(service_request)
        commission_amount = (order.total * commission_rate) / 100

        invoice = Invoice.objects.create(
            order=order,
            buyer=order.buyer,
            seller=order.seller,
            subtotal=order.subtotal,
            total=order.total,
            platform_commission_rate=commission_rate,
            platform_commission_amount=commission_amount,
            status=Invoice.InvoiceStatus.ISSUED,
            issued_at=timezone.now(),
        )

        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify_payment(self, request, pk=None):
        """ادمین: تایید پرداخت سفارش"""
        order = self.get_object()
        order.payment_verified = True
        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=['payment_verified', 'payment_status'])
        return Response({'success': True, 'message': 'پرداخت تایید شد'})