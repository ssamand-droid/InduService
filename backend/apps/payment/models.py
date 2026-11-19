# apps/payment/models.py - نسخه اصلاح‌شده و یکپارچه
from decimal import Decimal
from django.db import models, transaction
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TimeStampedModel
from core.utils import generate_random_code
from orders.models import Order
from services.models import ServiceRequest, Service, ServiceCategory
from users.models import User

DEFAULT_COMMISSION_RATE = Decimal('12.00')


# ========================
# Commission Rule
# ========================
class CommissionRule(TimeStampedModel):
    """قوانین کمیسیون برای سناریوها و خدمات مختلف"""

    class RuleType(models.TextChoices):
        SCENARIO = 'scenario', _('بر اساس سناریو')
        SERVICE = 'service', _('بر اساس خدمت خاص')
        CATEGORY = 'category', _('بر اساس دسته‌بندی')
        DEFAULT = 'default', _('پیش‌فرض')

    rule_type = models.CharField(_('نوع قانون'), max_length=20, choices=RuleType.choices, default=RuleType.DEFAULT)
    service_scenario = models.CharField(_('سناریو'), max_length=30, blank=True, null=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, null=True, blank=True)

    commission_rate = models.DecimalField(_('درصد کمیسیون'), max_digits=5, decimal_places=2, default=DEFAULT_COMMISSION_RATE)
    min_commission = models.DecimalField(_('حداقل کمیسیون (ریال)'), max_digits=10, decimal_places=0, default=0)
    max_commission = models.DecimalField(_('حداکثر کمیسیون (ریال)'), max_digits=12, decimal_places=0, default=0)
    advance_payment_rate = models.DecimalField(
        _('درصد پیش‌پرداخت'), max_digits=5, decimal_places=2, default=0,
        help_text='درصدی از مبلغ که باید پیش‌پرداخت شود'
    )

    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('قانون کمیسیون')
        verbose_name_plural = _('قوانین کمیسیون')
        ordering = ['-created_at']

    def __str__(self):
        if self.rule_type == 'default':
            return f'پیش‌فرض: {self.commission_rate}%'
        return f'{self.get_rule_type_display()}: {self.commission_rate}%'


# ========================
# Wallet
# ========================
class Wallet(TimeStampedModel):
    """کیف پول کاربران"""
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(_('موجودی (ریال)'), max_digits=14, decimal_places=0, default=0)
    frozen_balance = models.DecimalField(_('موجودی مسدود شده'), max_digits=14, decimal_places=0, default=0)

    class Meta:
        verbose_name = _('کیف پول')
        verbose_name_plural = _('کیف پول‌ها')

    def __str__(self):
        return f'Wallet of {self.user.phone_number}'

    @property
    def available_balance(self):
        return self.balance - self.frozen_balance


# ========================
# Wallet Transaction
# ========================
class WalletTransaction(TimeStampedModel):
    """تراکنش‌های کیف پول"""

    class TransactionType(models.TextChoices):
        DEPOSIT = 'deposit', _('واریز')
        WITHDRAWAL = 'withdrawal', _('برداشت')
        COMMISSION = 'commission', _('کمیسیون')
        PAYMENT = 'payment', _('پرداخت خدمت')
        REFUND = 'refund', _('بازگشت وجه')
        ADVANCE = 'advance', _('پیش‌پرداخت')

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(_('مبلغ'), max_digits=14, decimal_places=0)
    transaction_type = models.CharField(_('نوع'), max_length=15, choices=TransactionType.choices)
    description = models.TextField(_('توضیحات'), blank=True)
    reference_id = models.CharField(_('شناسه مرجع'), max_length=100, blank=True)

    class Meta:
        verbose_name = _('تراکنش کیف پول')
        verbose_name_plural = _('تراکنش‌های کیف پول')
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['reference_id', 'transaction_type'],
                name='uniq_wallet_tx_reference_type',
                condition=Q(reference_id__gt=''),
            ),
        ]

    def __str__(self):
        return f'{self.get_transaction_type_display()} - {self.amount} ریال'


# ========================
# Invoice
# ========================
class Invoice(TimeStampedModel):
    """فاکتور رسمی"""

    class InvoiceStatus(models.TextChoices):
        DRAFT = 'draft', _('پیش‌نویس')
        ISSUED = 'issued', _('صادر شده')
        PAID = 'paid', _('پرداخت شده')
        PARTIALLY_PAID = 'partially_paid', _('پرداخت جزئی')
        CANCELLED = 'cancelled', _('باطل شده')

    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name='invoice', null=True, blank=True)
    service_request = models.OneToOneField(
        ServiceRequest, on_delete=models.PROTECT, related_name='invoice', null=True, blank=True
    )
    buyer = models.ForeignKey('users.User', on_delete=models.PROTECT, related_name='buyer_invoices')
    seller = models.ForeignKey('users.User', on_delete=models.PROTECT, related_name='seller_invoices')

    invoice_number = models.CharField(_('شماره فاکتور'), max_length=20, unique=True, blank=True)
    status = models.CharField(_('وضعیت'), max_length=15, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)

    subtotal = models.DecimalField(_('جمع خالص'), max_digits=14, decimal_places=0)
    advance_payment = models.DecimalField(_('پیش‌پرداخت'), max_digits=14, decimal_places=0, default=0)
    platform_commission_rate = models.DecimalField(
        _('درصد کمیسیون (snapshot)'), max_digits=5, decimal_places=2, default=DEFAULT_COMMISSION_RATE,
        help_text='نرخ در زمان صدور فاکتور قفل می‌شود'
    )
    platform_commission_amount = models.DecimalField(_('مبلغ کمیسیون'), max_digits=12, decimal_places=0, default=0)
    total = models.DecimalField(_('مبلغ نهایی'), max_digits=14, decimal_places=0)
    remaining_amount = models.DecimalField(_('مبلغ باقی‌مانده'), max_digits=14, decimal_places=0, default=0)

    issued_at = models.DateTimeField(_('تاریخ صدور'), null=True, blank=True)
    paid_at = models.DateTimeField(_('تاریخ پرداخت'), null=True, blank=True)
    due_date = models.DateField(_('مهلت پرداخت'), null=True, blank=True)

    class Meta:
        verbose_name = _('فاکتور')
        verbose_name_plural = _('فاکتورها')
        ordering = ['-created_at']

    def __str__(self):
        return f'فاکتور {self.invoice_number}'

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f'INV-{generate_random_code(8)}'

        if self.pk:
            paid_sum = self.payments.filter(status='verified').aggregate(
                s=models.Sum('amount')
            )['s'] or Decimal('0')
            self.remaining_amount = (self.total or Decimal('0')) - paid_sum
        else:
            self.remaining_amount = (self.total or Decimal('0')) - (self.advance_payment or Decimal('0'))

        super().save(*args, **kwargs)

    # ---------- سازگاری با کد قدیمی ----------
    @property
    def payment_receipt(self):
        """آخرین رسید پرداخت (برای نمایش)"""
        p = self.payments.order_by('-created_at').first()
        return p.receipt.image if p and hasattr(p, 'receipt') and p.receipt else None

    @property
    def payment_verified(self):
        """آیا آخرین پرداخت تأیید شده؟"""
        p = self.payments.order_by('-created_at').first()
        return bool(p and p.status == Payment.PaymentStatus.VERIFIED)

    @property
    def paid_amount(self):
        return self.payments.filter(status=Payment.PaymentStatus.VERIFIED).aggregate(
            s=models.Sum('amount')
        )['s'] or Decimal('0')

    # ---------- قوانین کمیسیون ----------
    @staticmethod
    def _resolve_rule(service_request, field):
        """
        انتخاب قانون بر اساس اولویت:
          1) خدمت خاص
          2) سناریو
          3) دسته‌بندی
          4) پیش‌فرض
        null-safe.
        """
        if service_request is None:
            rule = CommissionRule.objects.filter(rule_type='default', is_active=True).order_by('-created_at').first()
            return getattr(rule, field) if rule else None

        service = getattr(service_request, 'service', None)
        service_scenario = getattr(service, 'service_scenario', None) if service else None
        category = getattr(service, 'category', None) if service else None

        # 1) خدمت خاص
        if service:
            rule = CommissionRule.objects.filter(
                rule_type='service', service=service, is_active=True
            ).order_by('-created_at').first()
            if rule:
                return getattr(rule, field)

        # 2) سناریو
        if service_scenario:
            rule = CommissionRule.objects.filter(
                rule_type='scenario', service_scenario=service_scenario, is_active=True
            ).order_by('-created_at').first()
            if rule:
                return getattr(rule, field)

        # 3) دسته‌بندی
        if category:
            rule = CommissionRule.objects.filter(
                rule_type='category', category=category, is_active=True
            ).order_by('-created_at').first()
            if rule:
                return getattr(rule, field)

        # 4) پیش‌فرض
        rule = CommissionRule.objects.filter(
            rule_type='default', is_active=True
        ).order_by('-created_at').first()
        return getattr(rule, field) if rule else None

    @classmethod
    def get_commission_rate(cls, service_request=None):
        value = cls._resolve_rule(service_request, 'commission_rate')
        return value if value is not None else DEFAULT_COMMISSION_RATE

    @classmethod
    def get_advance_rate(cls, service_request=None):
        value = cls._resolve_rule(service_request, 'advance_payment_rate')
        return value if value is not None else Decimal('0')

    @classmethod
    def build_for_service_request(cls, service_request, seller, total, advance=Decimal('0')):
        """
        ساخت فاکتور با نرخ کمیسیون صحیح (snapshot) و محاسبه صحیح مبلغ کمیسیون.
        """
        rate = cls.get_commission_rate(service_request)
        commission_amount = (Decimal(total) * rate / Decimal('100')).quantize(Decimal('1'))
        return cls(
            service_request=service_request,
            buyer=service_request.buyer,
            seller=seller,
            subtotal=Decimal(total),
            total=Decimal(total),
            advance_payment=Decimal(advance),
            remaining_amount=Decimal(total) - Decimal(advance),
            platform_commission_rate=rate,
            platform_commission_amount=commission_amount,
            status=cls.InvoiceStatus.ISSUED,
            issued_at=timezone.now(),
        )


# ========================
# Payment (پرداخت مستقل)
# ========================
class Payment(TimeStampedModel):
    """هر پرداخت مستقل روی فاکتور"""

    class PaymentType(models.TextChoices):
        ADVANCE = 'advance', _('پیش‌پرداخت')
        FINAL = 'final', _('پرداخت نهایی')
        INSTALLMENT = 'installment', _('قسط')

    class PaymentMethod(models.TextChoices):
        ONLINE = 'online', _('آنلاین')
        CARD_TO_CARD = 'card_to_card', _('کارت به کارت')
        WALLET = 'wallet', _('کیف پول')

    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', _('در انتظار پرداخت')
        SUBMITTED = 'submitted', _('رسید ارسال شده')
        VERIFIED = 'verified', _('تأیید شده')
        REJECTED = 'rejected', _('رد شده')

    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payments')
    payment_type = models.CharField(_('نوع پرداخت'), max_length=15, choices=PaymentType.choices)
    amount = models.DecimalField(_('مبلغ'), max_digits=14, decimal_places=0)
    method = models.CharField(_('روش پرداخت'), max_length=15, choices=PaymentMethod.choices, default=PaymentMethod.CARD_TO_CARD)

    status = models.CharField(_('وضعیت'), max_length=15, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)

    reference_id = models.CharField(_('شناسه پیگیری'), max_length=100, blank=True)

    paid_at = models.DateTimeField(_('زمان پرداخت'), null=True, blank=True)
    verified_at = models.DateTimeField(_('زمان تأیید'), null=True, blank=True)
    verified_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_payments'
    )
    rejection_reason = models.TextField(_('دلیل رد'), blank=True)

    class Meta:
        verbose_name = _('پرداخت')
        verbose_name_plural = _('پرداخت‌ها')
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['invoice', 'reference_id'],
                name='uniq_payment_invoice_reference',
                condition=Q(reference_id__gt=''),
            ),
        ]

    def __str__(self):
        return f'{self.get_payment_type_display()} - {self.amount} ریال - {self.get_status_display()}'

    @transaction.atomic
    def verify(self, admin_user=None):
        """تأیید پرداخت و واریز مبلغ این پرداخت (نه کل فاکتور)"""
        if self.status == self.PaymentStatus.VERIFIED:
            return False

        self.status = self.PaymentStatus.VERIFIED
        self.verified_at = timezone.now()
        self.verified_by = admin_user
        self.save(update_fields=['status', 'verified_at', 'verified_by', 'updated_at'])

        invoice = self.invoice

        commission_share = (self.amount * invoice.platform_commission_rate / Decimal('100')).quantize(Decimal('1'))
        seller_share = self.amount - commission_share

        seller_wallet, _ = Wallet.objects.get_or_create(user=invoice.seller)
        seller_wallet.balance += seller_share
        seller_wallet.save(update_fields=['balance', 'updated_at'])

        WalletTransaction.objects.get_or_create(
            wallet=seller_wallet,
            transaction_type=WalletTransaction.TransactionType.PAYMENT,
            reference_id=f'payment-{self.pk}',
            defaults={
                'amount': seller_share,
                'description': f'پرداخت {self.get_payment_type_display()} فاکتور {invoice.invoice_number}',
            }
        )

        if commission_share > 0:
            admin_user_obj = User.objects.filter(role='admin').first()
            if admin_user_obj:
                platform_wallet, _ = Wallet.objects.get_or_create(user=admin_user_obj)
                platform_wallet.balance += commission_share
                platform_wallet.save(update_fields=['balance', 'updated_at'])

                WalletTransaction.objects.get_or_create(
                    wallet=platform_wallet,
                    transaction_type=WalletTransaction.TransactionType.COMMISSION,
                    reference_id=f'payment-{self.pk}',
                    defaults={
                        'amount': commission_share,
                        'description': f'کمیسیون پرداخت {self.get_payment_type_display()} فاکتور {invoice.invoice_number}',
                    }
                )

        if invoice.remaining_amount <= 0:
            invoice.status = Invoice.InvoiceStatus.PAID
            invoice.paid_at = timezone.now()
        else:
            invoice.status = Invoice.InvoiceStatus.PARTIALLY_PAID
        invoice.save()

        return True


# ========================
# PaymentReceipt
# ========================
class PaymentReceipt(TimeStampedModel):
    """رسید هر پرداخت"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    image = models.ImageField(_('تصویر رسید'), upload_to='payment_receipts/')
    note = models.CharField(_('یادداشت'), max_length=200, blank=True)

    class Meta:
        verbose_name = _('رسید پرداخت')
        verbose_name_plural = _('رسیدهای پرداخت')

    def __str__(self):
        return f'رسید پرداخت #{self.payment_id}'


# ========================
# Transaction (درگاه آنلاین)
# ========================
class Transaction(TimeStampedModel):
    """تراکنش‌های مالی (درگاه آنلاین)"""

    class TransactionType(models.TextChoices):
        PAYMENT = 'payment', _('پرداخت')
        REFUND = 'refund', _('بازپرداخت')
        COMMISSION = 'commission', _('کمیسیون')

    class TransactionStatus(models.TextChoices):
        PENDING = 'pending', _('در انتظار')
        SUCCESS = 'success', _('موفق')
        FAILED = 'failed', _('ناموفق')
        CANCELLED = 'cancelled', _('لغو شده')

    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='transactions')
    payment = models.ForeignKey(
        Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='gateway_transactions'
    )
    user = models.ForeignKey('users.User', on_delete=models.PROTECT)
    amount = models.DecimalField(_('مبلغ'), max_digits=14, decimal_places=0)
    transaction_type = models.CharField(_('نوع تراکنش'), max_length=12, choices=TransactionType.choices)
    status = models.CharField(_('وضعیت'), max_length=10, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)

    payment_gateway = models.CharField(_('درگاه پرداخت'), max_length=50, blank=True)
    gateway_tracking_code = models.CharField(_('کد پیگیری درگاه'), max_length=100, blank=True)
    reference_number = models.CharField(_('شماره مرجع'), max_length=100, blank=True)

    description = models.TextField(_('توضیحات'), blank=True)
    payment_data = models.JSONField(_('داده‌های پرداخت'), default=dict, blank=True)

    paid_at = models.DateTimeField(_('زمان پرداخت'), null=True, blank=True)

    class Meta:
        verbose_name = _('تراکنش')
        verbose_name_plural = _('تراکنش‌ها')
        ordering = ['-created_at']

    def __str__(self):
        return f'تراکنش {self.id} - {self.amount} ریال'


# ========================
# Settlement
# ========================
class LedgerAccount(TimeStampedModel):
    class AccountType(models.TextChoices):
        CASH = 'cash', _('بانک / وجه نقد')
        EXPENSE = 'expense', _('هزینه')
        REVENUE = 'revenue', _('درآمد')

    organization = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT, related_name='ledger_accounts')
    code = models.CharField(max_length=40)
    name = models.CharField(max_length=120)
    account_type = models.CharField(max_length=12, choices=AccountType.choices)
    currency = models.CharField(max_length=3, default='IRR')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['organization', 'code', 'currency'], name='uniq_org_ledger_account')]

    @property
    def balance(self):
        totals = self.entries.aggregate(debit=models.Sum('debit'), credit=models.Sum('credit'))
        debit = totals['debit'] or Decimal('0')
        credit = totals['credit'] or Decimal('0')
        if self.account_type in (self.AccountType.CASH, self.AccountType.EXPENSE):
            return debit - credit
        return credit - debit


class LedgerJournal(TimeStampedModel):
    organization = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT, related_name='ledger_journals')
    source_key = models.CharField(max_length=100)
    memo = models.CharField(max_length=250)
    currency = models.CharField(max_length=3, default='IRR')
    posted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['organization', 'source_key'], name='uniq_org_ledger_source')]


class LedgerEntry(TimeStampedModel):
    journal = models.ForeignKey(LedgerJournal, on_delete=models.PROTECT, related_name='entries')
    account = models.ForeignKey(LedgerAccount, on_delete=models.PROTECT, related_name='entries')
    description = models.CharField(max_length=250, blank=True)
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        constraints = [models.CheckConstraint(
            check=(models.Q(debit__gt=0, credit=0) | models.Q(credit__gt=0, debit=0)),
            name='ledger_entry_one_sided_positive',
        )]


class Settlement(TimeStampedModel):
    """درخواست تسویه حساب"""

    class SettlementStatus(models.TextChoices):
        PENDING = 'pending', _('در انتظار تایید')
        APPROVED = 'approved', _('تایید شده')
        PAID = 'paid', _('پرداخت شده')
        REJECTED = 'rejected', _('رد شده')

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='settlements')
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='settlements')
    amount = models.DecimalField(_('مبلغ درخواستی'), max_digits=14, decimal_places=0)
    status = models.CharField(_('وضعیت'), max_length=15, choices=SettlementStatus.choices, default=SettlementStatus.PENDING)

    bank_name = models.CharField(_('نام بانک'), max_length=100)
    bank_account_number = models.CharField(_('شماره حساب'), max_length=50)
    bank_card_number = models.CharField(_('شماره کارت'), max_length=20, blank=True)
    bank_shaba = models.CharField(_('شماره شبا'), max_length=26, blank=True)
    bank_account_holder = models.CharField(_('نام صاحب حساب'), max_length=200)

    admin_note = models.TextField(_('یادداشت ادمین'), blank=True)
    approved_at = models.DateTimeField(_('تاریخ تایید'), null=True, blank=True)
    paid_at = models.DateTimeField(_('تاریخ پرداخت'), null=True, blank=True)

    class Meta:
        verbose_name = _('تسویه حساب')
        verbose_name_plural = _('تسویه حساب‌ها')
        ordering = ['-created_at']

    def __str__(self):
        return f'تسویه {self.user.full_name} - {self.amount} ریال'

    @transaction.atomic
    def reject(self, admin_note=''):
        """رد تسویه + آزادسازی مبلغ مسدودشده"""
        if self.status == self.SettlementStatus.REJECTED:
            return False
        if self.status not in [self.SettlementStatus.PENDING, self.SettlementStatus.APPROVED]:
            return False

        wallet = self.wallet
        wallet.frozen_balance = max(Decimal('0'), wallet.frozen_balance - self.amount)
        wallet.save(update_fields=['frozen_balance', 'updated_at'])

        self.status = self.SettlementStatus.REJECTED
        self.admin_note = admin_note or self.admin_note
        self.save(update_fields=['status', 'admin_note', 'updated_at'])
        return True

    @transaction.atomic
    def mark_paid(self):
        """تأیید نهایی پرداخت تسویه"""
        if self.status == self.SettlementStatus.PAID:
            return False
        if self.status != self.SettlementStatus.APPROVED:
            return False

        wallet = self.wallet
        wallet.balance -= self.amount
        wallet.frozen_balance = max(Decimal('0'), wallet.frozen_balance - self.amount)
        wallet.save(update_fields=['balance', 'frozen_balance', 'updated_at'])

        WalletTransaction.objects.get_or_create(
            wallet=wallet,
            transaction_type=WalletTransaction.TransactionType.WITHDRAWAL,
            reference_id=f'settlement-{self.pk}',
            defaults={
                'amount': self.amount,
                'description': f'تسویه حساب - {self.bank_name} {self.bank_account_number}',
            }
        )

        self.status = self.SettlementStatus.PAID
        self.paid_at = timezone.now()
        self.save(update_fields=['status', 'paid_at', 'updated_at'])
        return True
