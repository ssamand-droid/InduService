# apps/payment/views.py

from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models as db_models
from django.db import transaction
from rest_framework.permissions import IsAdminUser
from .models import (
    Invoice, Transaction, CommissionRule, Wallet, WalletTransaction,
    Settlement, Payment, PaymentReceipt
)
from .serializers import (
    InvoiceSerializer, CreatePaymentSerializer,
    CommissionRuleSerializer, WalletSerializer, WalletTransactionSerializer,
    SettlementSerializer, PaymentSerializer, PaymentReceiptSerializer,
)
from orders.models import Order
from users.models import User
from notification.services import create_notification


# ============================================================
# InvoiceViewSet
# ============================================================
class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """فاکتورها - قابل مشاهده برای خریدار، فروشنده و ادمین"""
    queryset = Invoice.objects.select_related('order', 'service_request', 'buyer', 'seller')\
                              .prefetch_related('transactions', 'payments').all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return self.queryset
        return self.queryset.filter(
            db_models.Q(buyer=user) | db_models.Q(seller=user)
        )

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != Invoice.InvoiceStatus.ISSUED:
            return Response({'error': 'فاکتور قابل پرداخت نیست'}, status=400)

        transaction = Transaction.objects.create(
            invoice=invoice,
            user=request.user,
            amount=invoice.remaining_amount,
            transaction_type=Transaction.TransactionType.PAYMENT,
            payment_gateway='درگاه آزمایشی',
            description=f'پرداخت فاکتور {invoice.invoice_number}'
        )
        return Response({'message': 'آماده پرداخت', 'transaction_id': transaction.id})

    @action(detail=False, methods=['post'], permission_classes=[])
    def verify(self, request):
        transaction_id = request.data.get('transaction_id')
        success = request.data.get('success', False)
        ref_number = request.data.get('ref_number')

        try:
            transaction = Transaction.objects.get(id=transaction_id)
        except Transaction.DoesNotExist:
            return Response({'error': 'تراکنش یافت نشد'}, status=404)

        if success:
            transaction.status = Transaction.TransactionStatus.SUCCESS
            transaction.reference_number = ref_number
            transaction.paid_at = timezone.now()
            transaction.save()

            invoice = transaction.invoice
            invoice.status = Invoice.InvoiceStatus.PAID
            invoice.paid_at = timezone.now()
            invoice.save()

            if invoice.order:
                invoice.order.payment_status = Order.PaymentStatus.PAID
                invoice.order.save()

            return Response({'message': 'پرداخت موفق'})
        else:
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.save()
            return Response({'error': 'پرداخت ناموفق'}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify_payment(self, request, pk=None):
        """ادمین: تأیید آخرین Payment SUBMITTED این فاکتور (سازگاری)"""
        invoice = self.get_object()
        payment = invoice.payments.filter(status=Payment.PaymentStatus.SUBMITTED).order_by('-created_at').first()
        if not payment:
            return Response({'error': 'پرداخت در انتظار تأیید یافت نشد'}, status=400)

        payment.verify(admin_user=request.user)
        return Response({
            'success': True,
            'message': f'{payment.amount:,} ریال تأیید و به کیف پول فروشنده واریز شد.',
            'payment_id': payment.id,
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject_payment(self, request, pk=None):
        """ادمین: رد آخرین Payment SUBMITTED"""
        invoice = self.get_object()
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'error': 'دلیل رد الزامی است'}, status=400)

        payment = invoice.payments.filter(status=Payment.PaymentStatus.SUBMITTED).order_by('-created_at').first()
        if not payment:
            return Response({'error': 'پرداخت در انتظار تأیید یافت نشد'}, status=400)

        payment.status = Payment.PaymentStatus.REJECTED
        payment.rejection_reason = reason
        payment.save(update_fields=['status', 'rejection_reason', 'updated_at'])

        create_notification(
            user=invoice.buyer, type='payment',
            title='❌ رسید پرداخت رد شد',
            message=f'دلیل: {reason}. لطفاً مجدداً رسید ارسال کنید.',
        )
        return Response({'success': True, 'message': 'پرداخت رد شد'})


# ============================================================
# PaymentViewSet
# ============================================================
class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """پرداخت‌های مستقل هر فاکتور"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related('invoice', 'verified_by')\
                            .prefetch_related('receipt')
        if user.is_staff:
            return qs
        return qs.filter(
            db_models.Q(invoice__buyer=user) | db_models.Q(invoice__seller=user)
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    @transaction.atomic
    def verify(self, request, pk=None):
        payment = self.get_object()
        if payment.status != Payment.PaymentStatus.SUBMITTED:
            return Response({'error': 'فقط پرداخت‌های SUBMITTED قابل تأیید هستند'}, status=400)
        payment.verify(admin_user=request.user)
        create_notification(
            user=payment.invoice.seller, type='payment',
            title='💰 پرداخت تأیید شد',
            message=f'{payment.amount:,} ریال بابت {payment.get_payment_type_display()} فاکتور {payment.invoice.invoice_number}',
            link='/wallet'
        )
        return Response({'success': True, 'message': 'پرداخت تأیید شد.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        payment = self.get_object()
        if payment.status != Payment.PaymentStatus.SUBMITTED:
            return Response({'error': 'فقط پرداخت‌های SUBMITTED قابل رد هستند'}, status=400)
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'error': 'دلیل رد الزامی است'}, status=400)

        payment.status = Payment.PaymentStatus.REJECTED
        payment.rejection_reason = reason
        payment.save(update_fields=['status', 'rejection_reason', 'updated_at'])

        create_notification(
            user=payment.invoice.buyer, type='payment',
            title='❌ رسید پرداخت رد شد',
            message=f'دلیل: {reason}. لطفاً مجدداً رسید ارسال کنید.',
        )
        return Response({'success': True, 'message': 'پرداخت رد شد.'})


# ============================================================
# CommissionRuleViewSet
# ============================================================
class CommissionRuleViewSet(viewsets.ModelViewSet):
    queryset = CommissionRule.objects.all()
    serializer_class = CommissionRuleSerializer
    permission_classes = [IsAdminUser]


# ============================================================
# WalletViewSet
# ============================================================
class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Wallet.objects.all()
        return Wallet.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        return Response(self.get_serializer(wallet).data)

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        qs = wallet.transactions.all().order_by('-created_at')[:50]
        return Response(WalletTransactionSerializer(qs, many=True).data)


# ============================================================
# SettlementViewSet
# ============================================================
class SettlementViewSet(viewsets.ModelViewSet):
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Settlement.objects.all().order_by('-created_at')
        return Settlement.objects.filter(user=user).order_by('-created_at')

    @transaction.atomic
    def perform_create(self, serializer):
        wallet = Wallet.objects.select_for_update().get(user=self.request.user)
        amount = serializer.validated_data['amount']

        if amount > wallet.available_balance:
            raise serializers.ValidationError("موجودی کافی نیست")

        wallet.frozen_balance += amount
        wallet.save(update_fields=['frozen_balance', 'updated_at'])

        profile = self.request.user.profile

        serializer.save(
            user=self.request.user,
            wallet=wallet,
            bank_name=profile.bank_name or 'تعیین نشده',
            bank_account_number=profile.bank_account_number or 'تعیین نشده',
            bank_card_number=profile.bank_card_number or '',
            bank_shaba=profile.bank_shaba or '',
            bank_account_holder=profile.bank_account_holder or self.request.user.full_name,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        settlement = self.get_object()
        if settlement.status != Settlement.SettlementStatus.PENDING:
            return Response({'error': 'وضعیت قابل تغییر نیست'}, status=400)

        settlement.status = Settlement.SettlementStatus.APPROVED
        settlement.approved_at = timezone.now()
        settlement.save(update_fields=['status', 'approved_at', 'updated_at'])
        return Response({'message': 'تسویه تایید شد'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_paid(self, request, pk=None):
        settlement = self.get_object()
        ok = settlement.mark_paid()
        if not ok:
            return Response({'error': 'ابتدا باید تأیید شود یا قبلاً پرداخت شده'}, status=400)

        create_notification(
            user=settlement.user, type='payment',
            title='✅ تسویه حساب انجام شد',
            message=f'{settlement.amount:,} ریال به حساب شما واریز شد.',
            link='/wallet'
        )
        return Response({'message': 'پرداخت شد'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        settlement = self.get_object()
        note = request.data.get('admin_note', '')
        ok = settlement.reject(admin_note=note)
        if not ok:
            return Response({'error': 'وضعیت قابل رد نیست یا قبلاً رد شده'}, status=400)

        create_notification(
            user=settlement.user, type='payment',
            title='❌ درخواست تسویه رد شد',
            message=f'دلیل: {note or "بدون توضیح"}',
            link='/wallet'
        )
        return Response({'success': True, 'message': 'تسویه رد شد و مبلغ آزاد شد.'})