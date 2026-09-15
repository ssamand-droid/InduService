from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models as db_models
from rest_framework.permissions import IsAdminUser
from .models import Invoice, Transaction, CommissionRule, Wallet, WalletTransaction, Settlement
from .serializers import (
    InvoiceSerializer, CreatePaymentSerializer,
    CommissionRuleSerializer, WalletSerializer, WalletTransactionSerializer,
    SettlementSerializer,
)
from orders.models import Order
from users.models import User
from notification.services import create_notification

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """فاکتورها - قابل مشاهده برای خریدار، فروشنده و ادمین"""
    queryset = Invoice.objects.select_related('order', 'service_request', 'buyer', 'seller').prefetch_related('transactions').all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return self.queryset

        # فاکتورهای مربوط به این کاربر (چه buyer چه seller)
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
            amount=invoice.total,
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
        """ادمین: تایید رسید و واریز به کیف پول فروشنده"""
        invoice = self.get_object()

        if invoice.payment_verified:
            return Response({'error': 'قبلاً تایید شده'}, status=400)

        if not invoice.payment_receipt:
            return Response({'error': 'رسیدی آپلود نشده'}, status=400)

        invoice.payment_verified = True
        invoice.status = Invoice.InvoiceStatus.PAID
        invoice.paid_at = timezone.now()
        invoice.save()

        # واریز به کیف پول فروشنده
        seller_wallet, _ = Wallet.objects.get_or_create(user=invoice.seller)
        amount_to_seller = invoice.total - invoice.platform_commission_amount
        seller_wallet.balance += amount_to_seller
        seller_wallet.save()

        WalletTransaction.objects.create(
            wallet=seller_wallet,
            amount=amount_to_seller,
            transaction_type='payment',
            description=f'پرداخت فاکتور {invoice.invoice_number} (کمیسیون {invoice.platform_commission_rate}%)',
            reference_id=str(invoice.id)
        )

        # کمیسیون پلتفرم
        admin_user = User.objects.filter(role='admin').first()
        if admin_user and invoice.platform_commission_amount > 0:
            platform_wallet, _ = Wallet.objects.get_or_create(user=admin_user)
            platform_wallet.balance += invoice.platform_commission_amount
            platform_wallet.save()
            WalletTransaction.objects.create(
                wallet=platform_wallet,
                amount=invoice.platform_commission_amount,
                transaction_type='commission',
                description=f'کمیسیون فاکتور {invoice.invoice_number}',
                reference_id=str(invoice.id)
            )

        # اعلان‌ها
        create_notification(user=invoice.seller, type='payment',
            title='💰 پرداخت تایید شد',
            message=f'{amount_to_seller:,} ریال به کیف پول شما واریز شد.', link='/wallet')

        create_notification(user=invoice.buyer, type='payment',
            title='✅ پرداخت تایید شد',
            message=f'پرداخت فاکتور {invoice.invoice_number} تایید شد.')

        return Response({
            'success': True,
            'message': f'{amount_to_seller:,} ریال به فروشنده واریز شد.',
            'seller_amount': float(amount_to_seller),
            'commission': float(invoice.platform_commission_amount),
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject_payment(self, request, pk=None):
        """ادمین: رد رسید پرداخت"""
        invoice = self.get_object()
        invoice.payment_receipt = None
        invoice.payment_verified = False
        invoice.save()

        from notification.services import create_notification
        create_notification(
            user=invoice.buyer,
            type='payment',
            title='❌ رسید پرداخت رد شد',
            message=f'رسید فاکتور {invoice.invoice_number} رد شد. لطفاً مجدداً رسید را آپلود کنید.',
        )

        return Response({'success': True, 'message': 'رسید پرداخت رد شد'})

class CommissionRuleViewSet(viewsets.ModelViewSet):
    """مدیریت قوانین کمیسیون توسط ادمین"""
    queryset = CommissionRule.objects.all()
    serializer_class = CommissionRuleSerializer
    permission_classes = [IsAdminUser]


class WalletViewSet(viewsets.ModelViewSet):
    """کیف پول کاربر - فقط خواندنی برای کاربر، کامل برای ادمین"""
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Wallet.objects.all()
        return Wallet.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        """کیف پول کاربر جاری"""
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(wallet)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        """تراکنش‌های کاربر جاری"""
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        transactions = wallet.transactions.all().order_by('-created_at')[:50]
        serializer = WalletTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify_payment(self, request, pk=None):
        invoice = self.get_object()

        invoice.payment_verified = True
        invoice.status = Invoice.InvoiceStatus.PAID
        invoice.paid_at = timezone.now()
        invoice.save()

        # واریز به فروشنده: total - commission
        seller_wallet, _ = Wallet.objects.get_or_create(user=invoice.seller)
        amount_to_seller = invoice.total - invoice.platform_commission_amount
        seller_wallet.balance += amount_to_seller
        seller_wallet.save()

        WalletTransaction.objects.create(
            wallet=seller_wallet,
            amount=amount_to_seller,
            transaction_type='payment',
            description=f'پرداخت فاکتور {invoice.invoice_number} (کمیسیون {invoice.platform_commission_rate}%)',
            reference_id=str(invoice.id)
        )

        # کمیسیون پلتفرم
        admin_user = User.objects.filter(role='admin').first()
        if admin_user and invoice.platform_commission_amount > 0:
            platform_wallet, _ = Wallet.objects.get_or_create(user=admin_user)
            platform_wallet.balance += invoice.platform_commission_amount
            platform_wallet.save()
            WalletTransaction.objects.create(
                wallet=platform_wallet,
                amount=invoice.platform_commission_amount,
                transaction_type='commission',
                description=f'کمیسیون فاکتور {invoice.invoice_number}',
                reference_id=str(invoice.id)
            )

        create_notification(user=invoice.seller, type='payment',
            title='💰 پرداخت تایید شد',
            message=f'{amount_to_seller:,} ریال به کیف پول شما واریز شد.', link='/wallet')

        return Response({'success': True, 'message': f'{amount_to_seller:,} ریال به فروشنده واریز شد.'})

# apps/payment/views.py - SettlementViewSet.perform_create

class SettlementViewSet(viewsets.ModelViewSet):
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Settlement.objects.all().order_by('-created_at')
        return Settlement.objects.filter(user=user).order_by('-created_at')


    def perform_create(self, serializer):
        wallet = Wallet.objects.get(user=self.request.user)
        amount = serializer.validated_data['amount']

        if amount > wallet.available_balance:
            raise serializers.ValidationError("موجودی کافی نیست")

        wallet.frozen_balance += amount
        wallet.save()

        profile = self.request.user.profile

        # اطلاعات بانکی را از پروفایل بگیر، اگر خالی بود از default استفاده کن
        bank_name = profile.bank_name or 'تعیین نشده'
        bank_account_number = profile.bank_account_number or 'تعیین نشده'
        bank_card_number = profile.bank_card_number or ''
        bank_shaba = profile.bank_shaba or ''
        bank_account_holder = profile.bank_account_holder or self.request.user.full_name

        serializer.save(
            user=self.request.user,
            wallet=wallet,
            bank_name=bank_name,
            bank_account_number=bank_account_number,
            bank_card_number=bank_card_number,
            bank_shaba=bank_shaba,
            bank_account_holder=bank_account_holder,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        settlement = self.get_object()
        if settlement.status != Settlement.SettlementStatus.PENDING:
            return Response({'error': 'وضعیت قابل تغییر نیست'}, status=400)

        settlement.status = Settlement.SettlementStatus.APPROVED
        settlement.approved_at = timezone.now()
        settlement.save()
        return Response({'message': 'تسویه تایید شد'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_paid(self, request, pk=None):
        settlement = self.get_object()
        if settlement.status != Settlement.SettlementStatus.APPROVED:
            return Response({'error': 'ابتدا باید تایید شود'}, status=400)

        settlement.status = Settlement.SettlementStatus.PAID
        settlement.paid_at = timezone.now()
        settlement.save()

        wallet = settlement.wallet
        wallet.balance -= settlement.amount
        wallet.frozen_balance -= settlement.amount
        wallet.save()

        WalletTransaction.objects.create(
            wallet=wallet,
            amount=settlement.amount,
            transaction_type='withdrawal',
            description=f'تسویه حساب - {settlement.bank_name} {settlement.bank_account_number}',
            reference_id=str(settlement.id)
        )

        create_notification(
            user=settlement.user,
            type='payment',
            title='✅ تسویه حساب انجام شد',
            message=f'{settlement.amount:,} ریال به حساب شما واریز شد.',
            link='/wallet'
        )

        return Response({'message': 'پرداخت شد'})