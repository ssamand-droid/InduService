# apps/payment/models.py - (کامل، کمیسیون، تراکنش، کیف پول)

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel
from core.utils import generate_random_code
from orders.models import Order
from services.models import ServiceRequest, Service, ServiceCategory

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

    commission_rate = models.DecimalField(_('درصد کمیسیون'), max_digits=5, decimal_places=2, default=12.0)
    min_commission = models.DecimalField(_('حداقل کمیسیون (ریال)'), max_digits=10, decimal_places=0, default=0)
    max_commission = models.DecimalField(_('حداکثر کمیسیون (ریال)'), max_digits=12, decimal_places=0, default=0)
    advance_payment_rate = models.DecimalField(_('درصد پیش‌پرداخت'), max_digits=5, decimal_places=2, default=0,
                                               help_text='درصدی از مبلغ که باید پیش‌پرداخت شود')

    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('قانون کمیسیون')
        verbose_name_plural = _('قوانین کمیسیون')

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
    service_request = models.OneToOneField(ServiceRequest, on_delete=models.PROTECT, related_name='invoice', null=True, blank=True)
    buyer = models.ForeignKey('users.User', on_delete=models.PROTECT, related_name='buyer_invoices')
    seller = models.ForeignKey('users.User', on_delete=models.PROTECT, related_name='seller_invoices')

    invoice_number = models.CharField(_('شماره فاکتور'), max_length=20, unique=True)
    status = models.CharField(_('وضعیت'), max_length=15, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)

    subtotal = models.DecimalField(_('جمع خالص'), max_digits=14, decimal_places=0)
    advance_payment = models.DecimalField(_('پیش‌پرداخت'), max_digits=14, decimal_places=0, default=0)
    platform_commission_rate = models.DecimalField(_('درصد کمیسیون'), max_digits=5, decimal_places=2, default=12.0)
    platform_commission_amount = models.DecimalField(_('مبلغ کمیسیون'), max_digits=12, decimal_places=0, default=0)
    total = models.DecimalField(_('مبلغ نهایی'), max_digits=14, decimal_places=0)
    remaining_amount = models.DecimalField(_('مبلغ باقی‌مانده (برای خریدار)'), max_digits=14, decimal_places=0, default=0)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f'INV-{generate_random_code(8)}'

        # محاسبه خودکار remaining_amount برای خریدار
        if not self.remaining_amount and self.total:
            self.remaining_amount = self.total - (self.advance_payment or 0)

        super().save(*args, **kwargs)


    issued_at = models.DateTimeField(_('تاریخ صدور'), null=True, blank=True)
    paid_at = models.DateTimeField(_('تاریخ پرداخت'), null=True, blank=True)
    due_date = models.DateField(_('مهلت پرداخت'), null=True, blank=True)

    # رسید پرداخت
    payment_receipt = models.ImageField(_('رسید پرداخت'), upload_to='payment_receipts/', blank=True, null=True)
    payment_verified = models.BooleanField(_('پرداخت تایید شده'), default=False)

    class Meta:
        verbose_name = _('فاکتور')
        verbose_name_plural = _('فاکتورها')
        ordering = ['-created_at']

    def __str__(self):
        return f'فاکتور {self.invoice_number}'

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f'INV-{generate_random_code(8)}'

        # محاسبه خودکار remaining_amount
        if not self.remaining_amount and self.total:
            self.remaining_amount = self.total - self.advance_payment

        super().save(*args, **kwargs)

    @classmethod
    def get_commission_rate(cls, service_request=None):
        """محاسبه نرخ کمیسیون بر اساس سناریو، خدمت یا دسته‌بندی"""
        if not service_request:
            default = CommissionRule.objects.filter(rule_type='default', is_active=True).first()
            return default.commission_rate if default else 12.0

        service = service_request.service

        # اولویت: خدمت خاص > سناریو > دسته‌بندی > پیش‌فرض
        rules = CommissionRule.objects.filter(is_active=True)

        rule = rules.filter(rule_type='service', service=service).first()
        if rule: return rule.commission_rate

        rule = rules.filter(rule_type='scenario', service_scenario=service.service_scenario).first()
        if rule: return rule.commission_rate

        rule = rules.filter(rule_type='category', category=service.category).first()
        if rule: return rule.commission_rate

        rule = rules.filter(rule_type='default').first()
        return rule.commission_rate if rule else 12.0

    @classmethod
    def get_advance_rate(cls, service_request=None):
        """محاسبه نرخ پیش‌پرداخت"""
        if not service_request:
            return 0
        rules = CommissionRule.objects.filter(is_active=True, service_scenario=service_request.service.service_scenario).first()
        if not rules:
            rules = CommissionRule.objects.filter(is_active=True, rule_type='default').first()
        return rules.advance_payment_rate if rules else 0


# ========================
# Transaction
# ========================
class Transaction(TimeStampedModel):
    """تراکنش‌های مالی (پرداخت آنلاین، کارت به کارت و ...)"""
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
# تسویه حساب
# ========================
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

    # اطلاعات بانکی (کپی از پروفایل در زمان درخواست)
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