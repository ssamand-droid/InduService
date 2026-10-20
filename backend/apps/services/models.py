"""
مدل‌های خدمات MRO: تعمیر، نگهداری، اورهال
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel, SoftDeleteModel
from users.models import User

class ServiceScenario(models.TextChoices):
    """سناریوهای استاندارد خدمات صنعتی MRO"""
    # گروه ۱: خدمات میدانی
    EMERGENCY_REPAIR = 'emergency_repair', _('تعمیرات اضطراری در محل')
    PREVENTIVE_MAINTENANCE = 'pm', _('نگهداری پیشگیرانه (PM)')
    PREDICTIVE_MAINTENANCE = 'pdm', _('پایش وضعیت و نگهداری پیش‌بینانه')
    COMMISSIONING = 'commissioning', _('نصب و راه‌اندازی')
    CALIBRATION = 'calibration', _('کالیبراسیون')

    # گروه ۲: خدمات کارگاهی
    OVERHAUL = 'overhaul', _('اورهال / تعمیرات اساسی')
    REWINDING = 'rewinding', _('سیم‌پیچی الکتروموتور/ترانس')
    MACHINING = 'machining', _('ماشین‌کاری و ساخت قطعه')
    # گروه جدید: ساخت پیشرفته
    REFURBISHMENT = 'refurbishment', _('بازسازی قطعات مستعمل')
    RAPID_PROTOTYPING = 'rapid_proto', _('ساخت سریع (پرینت سه بعدی)')
    SPECIALIZED_TEST = 'special_test', _('تست تخصصی (بالانس، عایقی و ...)')

    # گروه ۳: بازرسی
    THIRD_PARTY_INSPECTION = 'tpi', _('بازرسی شخص ثالث (TPI)')
    NDT = 'ndt', _('تست‌های غیرمخرب (NDT)')
    OIL_ANALYSIS = 'oil_analysis', _('آنالیز روغن')

    # گروه ۴: مهندسی
    REVERSE_ENGINEERING = 'reverse_eng', _('مهندسی معکوس و تهیه نقشه')
    ENGINEERING_CONSULTING = 'engineering_consult', _('مشاوره مهندسی')
    AUTOMATION = 'automation', _('برنامه‌نویسی PLC و اتوماسیون')
    ELECTRONICS_REPAIR = 'electronics_repair', _('تعمیرات بردهای الکترونیک صنعتی')

    # گروه ۵: تامین
    CRITICAL_SPARE = 'critical_spare', _('تامین قطعه یدکی بحرانی')
    SURPLUS_SALE = 'surplus', _('فروش تجهیزات مازاد')
    EQUIPMENT_LOAN = 'loan', _('امانت تجهیز')

    # گروه ۶: قراردادهای بلندمدت
    TOTAL_MAINTENANCE = 'total_maint', _('قرارداد نت فراگیر')
    PERFORMANCE_BASED = 'performance', _('قرارداد مبتنی بر عملکرد')
    CONSIGNMENT = 'consignment', _('انبار امانی (Consignment)')


class ServiceCategory(TimeStampedModel):
    """دسته‌بندی خدمات صنعتی"""
    name = models.CharField(_('نام دسته خدمات'), max_length=100)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)
    description = models.TextField(_('توضیحات'), blank=True)
    icon = models.ImageField(_('آیکون'), upload_to='services/categories/', blank=True)
    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('دسته‌بندی خدمات')
        verbose_name_plural = _('دسته‌بندی‌های خدمات')
        ordering = ['name']

    def __str__(self):
        return f'🔧 {self.name}'


class Service(TimeStampedModel, SoftDeleteModel):
    """
    مدل خدمات ارائه شده توسط فروشندگان/ارائه‌دهندگان خدمات
    """
    class ServiceType(models.TextChoices):
        REPAIR = 'repair', _('تعمیر')
        MAINTENANCE = 'maintenance', _('نگهداری')
        OVERHAUL = 'overhaul', _('اورهال')
        INSPECTION = 'inspection', _('بازرسی فنی')
        INSTALLATION = 'installation', _('نصب و راه‌اندازی')
        CONSULTING = 'consulting', _('مشاوره فنی')

    class PricingModel(models.TextChoices):
        FIXED = 'fixed', _('قیمت ثابت')
        HOURLY = 'hourly', _('ساعتی')
        QUOTATION = 'quotation', _('استعلام قیمت')
        PER_PROJECT = 'per_project', _('پروژه‌ای')

    provider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='services',
        limit_choices_to={'role__in': [User.Role.SELLER, User.Role.SERVICE_PROVIDER]},
        verbose_name=_('ارائه‌دهنده')
    )
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='services',
        verbose_name=_('دسته‌بندی')
    )

    title = models.CharField(_('عنوان خدمت'), max_length=200)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)
    service_type = models.CharField(_('نوع خدمت'), max_length=15, choices=ServiceType.choices)
    service_scenario = models.CharField(
        _('سناریوی خدمت'),
        max_length=30,
        choices=ServiceScenario.choices,
        default=ServiceScenario.EMERGENCY_REPAIR,
        help_text=_('نوع دقیق خدمت از لیست سناریوهای استاندارد')
    )
    pricing_model = models.CharField(_('مدل قیمت‌گذاری'), max_length=15, choices=PricingModel.choices, default=PricingModel.QUOTATION)
    base_price = models.DecimalField(_('قیمت پایه (ریال)'), max_digits=14, decimal_places=0, null=True, blank=True)
    hourly_rate = models.DecimalField(_('نرخ ساعتی'), max_digits=12, decimal_places=0, null=True, blank=True)

    description = models.TextField(_('شرح خدمت'))
    requirements = models.TextField(_('پیش‌نیازها و ملاحظات'), blank=True)
    estimated_duration_days = models.PositiveSmallIntegerField(_('مدت زمان تخمینی (روز)'), default=1)
    warranty_months = models.PositiveSmallIntegerField(_('گارانتی (ماه)'), default=0)

    service_area = models.CharField(_('محدوده خدمات'), max_length=200, blank=True)
    is_remote = models.BooleanField(_('قابلیت انجام از راه دور'), default=False)
    is_onsite = models.BooleanField(_('حضور در محل'), default=True)

    is_active = models.BooleanField(_('فعال'), default=True)
    is_featured = models.BooleanField(_('ویژه'), default=False)

    class Meta:
        verbose_name = _('خدمت')
        verbose_name_plural = _('خدمات')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.provider.full_name}"


class ServiceRequest(TimeStampedModel):
    """
    درخواست خدمات از طرف خریدار به ارائه‌دهنده
    """
    class Status(models.TextChoices):
        PENDING = 'pending', _('در انتظار بررسی')
        REVIEWED = 'reviewed', _('بررسی شده')
        QUOTED = 'quoted', _('قیمت داده شده')
        ACCEPTED = 'accepted', _('پذیرفته شده')
        REJECTED = 'rejected', _('رد شده')
        IN_PROGRESS = 'in_progress', _('در حال انجام')
        PENDING_ACCEPTANCE = 'pending_acceptance', _('در انتظار تأیید کارخانه')
        COMPLETED = 'completed', _('تأیید نهایی شده')
        CANCELLED = 'cancelled', _('لغو شده')

    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_requests',
                              limit_choices_to={'role': User.Role.BUYER})
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    title = models.CharField(_('عنوان درخواست'), max_length=200)
    description = models.TextField(_('شرح مشکل/نیاز'))
    equipment_details = models.TextField(_('مشخصات تجهیز'), blank=True)
    desired_start_date = models.DateField(_('تاریخ شروع مطلوب'), null=True, blank=True)
    urgency = models.CharField(_('فوریت'), max_length=10, choices=(
        ('low', 'کم'),
        ('medium', 'متوسط'),
        ('high', 'زیاد'),
        ('critical', 'بحرانی'),
    ), default='medium')

    status = models.CharField(_('وضعیت'), max_length=20, choices=Status.choices, default=Status.PENDING)
    provider_notes = models.TextField(_('یادداشت ارائه‌دهنده'), blank=True)
    quoted_price = models.DecimalField(_('قیمت پیشنهادی'), max_digits=14, decimal_places=0, null=True, blank=True)
    final_price = models.DecimalField(_('قیمت نهایی'), max_digits=14, decimal_places=0, null=True, blank=True)

    order = models.OneToOneField('orders.Order', on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='service_request')

    # فیلدهای اضافی برای سناریوهای خاص (ذخیره به صورت JSON)
    extra_data = models.JSONField(_('اطلاعات تکمیلی'), default=dict, blank=True,
                                  help_text=_('داده‌های اضافی بر اساس سناریو (مثلاً توان موتور برای سیم‌پیچی)'))
    # این فیلدها باید باشند:
    advance_payment_required = models.BooleanField(_('پیش‌پرداخت الزامی'), default=False)
    advance_payment_amount = models.DecimalField(_('مبلغ پیش‌پرداخت'), max_digits=14, decimal_places=0, null=True, blank=True)
    advance_payment_paid = models.BooleanField(_('پیش‌پرداخت پرداخت شده'), default=False)
    estimated_completion_date = models.DateField(_('تاریخ تخمینی اتمام'), null=True, blank=True)
    actual_completion_date = models.DateTimeField(_('تاریخ واقعی اتمام'), null=True, blank=True)
    force_majeure_declared = models.BooleanField(_('فورس ماژور اعلام شده'), default=False)
    force_majeure_reason = models.TextField(_('دلیل فورس ماژور'), blank=True)
    completion_notes = models.TextField(_('یادداشت تکمیل'), blank=True)
    buyer_rating = models.PositiveSmallIntegerField(_('امتیاز خریدار'), null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    buyer_review = models.TextField(_('نظر خریدار'), blank=True)
    reviewed_at = models.DateTimeField(_('تاریخ ثبت نظر'), null=True, blank=True)
    has_sample = models.BooleanField(_('نمونه موجود است'), default=False)
    has_drawing = models.BooleanField(_('نقشه موجود است'), default=False)
    drawing_file = models.FileField(_('فایل نقشه'), upload_to='service_requests/drawings/', null=True, blank=True)
    material_type = models.CharField(_('جنس قطعه'), max_length=100, blank=True)
    tolerance_mm = models.DecimalField(_('تلرانس (میلی‌متر)'), max_digits=5, decimal_places=3, null=True, blank=True)
    part_type = models.CharField(_('نوع قطعه'), max_length=20, choices=[
        ('mechanical', 'مکانیکی'),
        ('electrical', 'الکتریکی'),
        ('hydraulic', 'هیدرولیک/پنوماتیک'),
    ], null=True, blank=True)
    related_asset = models.ForeignKey(
        'assets.Asset',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='service_requests',
        verbose_name=_('دارایی مرتبط')
    )
    # فیلدهای بازسازی
    part_condition = models.TextField(_('وضعیت فعلی قطعه'), blank=True)
    expected_lifetime_months = models.PositiveIntegerField(_('عمر مورد انتظار پس از بازسازی (ماه)'), null=True, blank=True)

    # فیلد اتصال به دارایی هوشمند
    machine_id = models.CharField(_('شناسه دستگاه'), max_length=100, blank=True, help_text='اتصال به اپ دارایی هوشمند')
    machine_name = models.CharField(_('نام دستگاه'), max_length=200, blank=True)

    class Meta:
        verbose_name = _('درخواست خدمت')
        verbose_name_plural = _('درخواست‌های خدمت')
        ordering = ['-created_at']

    def __str__(self):
        buyer_name = self.buyer.full_name if self.buyer else 'ناشناس'
        service_title = self.service.title if self.service else 'بدون سرویس'
        return f"درخواست {buyer_name} برای {service_title}"

    matching_enabled = models.BooleanField(
    _('Matching Engine فعال'),
    default=True,
    help_text='در صورت غیرفعال بودن، فقط ارائه‌دهندگان مرتبط با سرویس می‌توانند درخواست را ببینند'
)
class ServiceImage(TimeStampedModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(_('تصویر'), upload_to='services/images/')
    alt_text = models.CharField(_('متن جایگزین'), max_length=200, blank=True)

    class Meta:
        verbose_name = _('تصویر خدمت')
        verbose_name_plural = _('تصاویر خدمت')


class ServiceRequestAttachment(TimeStampedModel):
    """پیوست‌های درخواست خدمت (عکس، فایل)"""
    service_request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('درخواست خدمت')
    )
    file = models.FileField(_('فایل'), upload_to='service_requests/attachments/')
    description = models.CharField(_('توضیحات'), max_length=200, blank=True)

    class Meta:
        verbose_name = _('پیوست درخواست')
        verbose_name_plural = _('پیوست‌های درخواست')

class ServiceCompletionImage(TimeStampedModel):
    """تصاویر تکمیل خدمت"""
    service_request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name='completion_attachments'
    )
    image = models.ImageField(_('تصویر'), upload_to='service_completion/')
    description = models.CharField(_('توضیحات'), max_length=200, blank=True)

    class Meta:
        verbose_name = _('تصویر تکمیل خدمت')
        verbose_name_plural = _('تصاویر تکمیل خدمت')

class ServiceRequestQuote(TimeStampedModel):
    """پیشنهاد قیمت ارائه‌دهندگان برای یک درخواست"""
    service_request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name='quotes',
        verbose_name=_('درخواست خدمت')
    )
    provider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quotes',
        verbose_name=_('ارائه‌دهنده'),
        limit_choices_to={'role__in': ['seller', 'service_provider', 'company_seller', 'company_provider']}
    )
    quoted_price = models.DecimalField(_('قیمت پیشنهادی'), max_digits=14, decimal_places=0)
    provider_notes = models.TextField(_('یادداشت ارائه‌دهنده'), blank=True)
    estimated_completion_date = models.DateField(_('تاریخ تخمینی اتمام'), null=True, blank=True)
    advance_payment_required = models.BooleanField(_('پیش‌پرداخت الزامی'), default=False)
    advance_payment_amount = models.DecimalField(_('مبلغ پیش‌پرداخت'), max_digits=14, decimal_places=0, null=True, blank=True)
    is_selected = models.BooleanField(_('انتخاب شده توسط خریدار'), default=False)

    class Meta:
        verbose_name = _('پیشنهاد قیمت')
        verbose_name_plural = _('پیشنهادهای قیمت')
        ordering = ['-created_at']
        unique_together = ['service_request', 'provider']  # هر ارائه‌دهنده فقط یک پیشنهاد

    def __str__(self):
        return f"پیشنهاد {self.provider.full_name} برای درخواست #{self.service_request.id}"