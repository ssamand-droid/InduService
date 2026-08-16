"""
مدل‌های مربوط به قراردادهای خدمات و انتقال تجهیزات
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel, UUIDModel
from users.models import User
from orders.models import Order
from services.models import ServiceRequest

class ServiceContract(TimeStampedModel, UUIDModel):
    """
    قرارداد رسمی بین خریدار (کارخانه) و ارائه‌دهنده خدمت
    این قرارداد پس از پذیرش درخواست خدمت یا سفارش پروژه‌ای ایجاد می‌شود
    """
    class ContractType(models.TextChoices):
        ONSITE_SERVICE = 'onsite', _('خدمات در محل')
        OFFSITE_REPAIR = 'offsite', _('تعمیر در تعمیرگاه (با انتقال تجهیز)')
        PROJECT_BASED = 'project', _('پروژه‌ای (ساخت/طراحی)')
        MAINTENANCE_CONTRACT = 'maintenance', _('قرارداد نگهداری دوره‌ای')

    class ContractStatus(models.TextChoices):
        DRAFT = 'draft', _('پیش‌نویس')
        PENDING_SIGNATURE = 'pending_signature', _('در انتظار امضای طرفین')
        SIGNED = 'signed', _('امضا شده')
        ACTIVE = 'active', _('در حال اجرا')
        COMPLETED = 'completed', _('تکمیل شده')
        TERMINATED = 'terminated', _('فسخ شده')
        EXPIRED = 'expired', _('منقضی شده')

    order = models.OneToOneField(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contract',
        verbose_name=_('سفارش مرتبط')
    )
    service_request = models.OneToOneField(
        ServiceRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contract',
        verbose_name=_('درخواست خدمت مرتبط')
    )

    buyer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='buyer_contracts',
        limit_choices_to={'role': User.Role.BUYER}
    )
    seller = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='seller_contracts',
        limit_choices_to={'role__in': [User.Role.SELLER, User.Role.SERVICE_PROVIDER]}
    )

    contract_number = models.CharField(_('شماره قرارداد'), max_length=30, unique=True)
    contract_type = models.CharField(_('نوع قرارداد'), max_length=20, choices=ContractType.choices)
    status = models.CharField(_('وضعیت'), max_length=20, choices=ContractStatus.choices, default=ContractStatus.DRAFT)

    title = models.CharField(_('عنوان قرارداد'), max_length=200)
    description = models.TextField(_('شرح خدمات/موضوع قرارداد'))
    scope_of_work = models.TextField(_('حوزه کار (Scope of Work)'), blank=True)
    technical_specifications = models.TextField(_('مشخصات فنی'), blank=True)

    # مبالغ و شرایط مالی
    contract_value = models.DecimalField(_('ارزش قرارداد (ریال)'), max_digits=14, decimal_places=0)
    advance_payment = models.DecimalField(_('پیش‌پرداخت'), max_digits=14, decimal_places=0, default=0)
    payment_terms = models.TextField(_('شرایط پرداخت'), blank=True)

    # زمان‌بندی
    start_date = models.DateField(_('تاریخ شروع'), null=True, blank=True)
    expected_completion_date = models.DateField(_('تاریخ اتمام پیش‌بینی شده'), null=True, blank=True)
    actual_completion_date = models.DateField(_('تاریخ اتمام واقعی'), null=True, blank=True)

    # ضمانت‌ها و جریمه‌ها
    warranty_period_months = models.PositiveSmallIntegerField(_('دوره گارانتی (ماه)'), default=0)
    penalty_clause = models.TextField(_('شرایط جریمه تاخیر'), blank=True)

    # محل انجام کار
    work_location_type = models.CharField(
        _('نوع محل انجام کار'),
        max_length=20,
        choices=[
            ('buyer_site', 'محل کارخانه/خریدار'),
            ('seller_site', 'محل تعمیرگاه/فروشنده'),
            ('both', 'هر دو'),
        ],
        default='buyer_site'
    )
    work_location_address = models.TextField(_('آدرس دقیق محل انجام کار'), blank=True)

    # امضای دیجیتال (ساده شده - در عمل از راهکارهای امضای دیجیتال استفاده می‌شود)
    buyer_signed = models.BooleanField(_('امضای خریدار'), default=False)
    seller_signed = models.BooleanField(_('امضای فروشنده'), default=False)
    buyer_signed_at = models.DateTimeField(_('تاریخ امضای خریدار'), null=True, blank=True)
    seller_signed_at = models.DateTimeField(_('تاریخ امضای فروشنده'), null=True, blank=True)

    # فایل قرارداد PDF (اختیاری)
    contract_file = models.FileField(_('فایل قرارداد'), upload_to='contracts/', blank=True, null=True)

    class Meta:
        verbose_name = _('قرارداد خدمت')
        verbose_name_plural = _('قراردادهای خدمت')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.contract_number} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.contract_number:
            from apps.core.utils import generate_random_code
            self.contract_number = f"CNT-{generate_random_code(10)}"
        # اگر هر دو طرف امضا کرده باشند، وضعیت به SIGNED تغییر کند
        if self.buyer_signed and self.seller_signed and self.status == self.ContractStatus.PENDING_SIGNATURE:
            self.status = self.ContractStatus.SIGNED
        super().save(*args, **kwargs)

    @property
    def is_fully_signed(self):
        return self.buyer_signed and self.seller_signed


class EquipmentTransfer(TimeStampedModel):
    """
    مدیریت انتقال تجهیز معیوب از کارخانه به تعمیرگاه و بالعکس
    برای خدمات offsite مانند سیم‌پیچی الکتروموتور
    """
    class TransferStatus(models.TextChoices):
        PENDING_PICKUP = 'pending_pickup', _('در انتظار بارگیری')
        IN_TRANSIT_TO_SELLER = 'in_transit_to_seller', _('در حال انتقال به تعمیرگاه')
        RECEIVED_BY_SELLER = 'received_by_seller', _('تحویل به تعمیرگاه')
        UNDER_REPAIR = 'under_repair', _('در حال تعمیر')
        READY_FOR_RETURN = 'ready_for_return', _('آماده عودت')
        IN_TRANSIT_TO_BUYER = 'in_transit_to_buyer', _('در حال عودت به کارخانه')
        DELIVERED_TO_BUYER = 'delivered_to_buyer', _('تحویل به کارخانه')

    contract = models.ForeignKey(
        ServiceContract,
        on_delete=models.CASCADE,
        related_name='equipment_transfers'
    )

    equipment_name = models.CharField(_('نام تجهیز'), max_length=200)
    equipment_model = models.CharField(_('مدل'), max_length=100, blank=True)
    serial_number = models.CharField(_('شماره سریال'), max_length=100, blank=True)
    quantity = models.PositiveIntegerField(_('تعداد'), default=1)
    weight_kg = models.DecimalField(_('وزن (کیلوگرم)'), max_digits=10, decimal_places=2, null=True, blank=True)

    # اطلاعات حمل و نقل
    pickup_address = models.TextField(_('آدرس بارگیری'))
    delivery_address = models.TextField(_('آدرس تحویل به تعمیرگاه'))
    return_address = models.TextField(_('آدرس عودت (معمولاً همان آدرس بارگیری)'))

    status = models.CharField(_('وضعیت انتقال'), max_length=30, choices=TransferStatus.choices, default=TransferStatus.PENDING_PICKUP)

    # زمان‌بندی
    pickup_date = models.DateTimeField(_('تاریخ بارگیری'), null=True, blank=True)
    received_by_seller_date = models.DateTimeField(_('تاریخ دریافت توسط تعمیرگاه'), null=True, blank=True)
    repair_completed_date = models.DateTimeField(_('تاریخ اتمام تعمیر'), null=True, blank=True)
    return_shipment_date = models.DateTimeField(_('تاریخ ارسال عودت'), null=True, blank=True)
    delivered_date = models.DateTimeField(_('تاریخ تحویل نهایی'), null=True, blank=True)

    # اطلاعات بارنامه
    outbound_tracking_code = models.CharField(_('کد رهگیری حمل رفت'), max_length=100, blank=True)
    return_tracking_code = models.CharField(_('کد رهگیری حمل برگشت'), max_length=100, blank=True)
    shipping_company = models.CharField(_('شرکت حمل‌ونقل'), max_length=100, blank=True)

    # هزینه حمل
    outbound_shipping_cost = models.DecimalField(_('هزینه حمل رفت'), max_digits=12, decimal_places=0, default=0)
    return_shipping_cost = models.DecimalField(_('هزینه حمل برگشت'), max_digits=12, decimal_places=0, default=0)
    shipping_paid_by = models.CharField(
        _('پرداخت کننده هزینه حمل'),
        max_length=10,
        choices=[('buyer', 'خریدار'), ('seller', 'فروشنده'), ('shared', 'مشترک')],
        default='buyer'
    )

    notes = models.TextField(_('یادداشت'), blank=True)

    class Meta:
        verbose_name = _('انتقال تجهیز')
        verbose_name_plural = _('انتقال تجهیزات')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.equipment_name} - {self.get_status_display()}"


class ContractMilestone(TimeStampedModel):
    """
    مراحل پرداخت یا تحویل در قرارداد (Milestones)
    """
    contract = models.ForeignKey(ServiceContract, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(_('عنوان مرحله'), max_length=200)
    description = models.TextField(_('توضیحات'), blank=True)
    due_date = models.DateField(_('تاریخ سررسید'), null=True, blank=True)
    amount = models.DecimalField(_('مبلغ (در صورت پرداخت)'), max_digits=14, decimal_places=0, default=0)
    is_completed = models.BooleanField(_('تکمیل شده'), default=False)
    completed_at = models.DateTimeField(_('تاریخ تکمیل'), null=True, blank=True)
    order_index = models.PositiveSmallIntegerField(_('ترتیب'), default=1)

    class Meta:
        verbose_name = _('مرحله قرارداد')
        verbose_name_plural = _('مراحل قرارداد')
        ordering = ['order_index']

    def __str__(self):
        return f"{self.contract.contract_number} - {self.title}"