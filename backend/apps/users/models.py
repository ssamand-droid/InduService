"""
مدل کاربر سفارشی با نقش‌های buyer, seller, service_provider
احراز هویت با شماره موبایل
"""
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel

class UserManager(BaseUserManager):
    """مدیر کاربر سفارشی - احراز هویت با شماره موبایل"""

    def _create_user(self, phone_number, password, **extra_fields):
        if not phone_number:
            raise ValueError(_('شماره موبایل الزامی است'))
        
        if 'email' not in extra_fields or not extra_fields.get('email'):
            extra_fields['email'] = f"{phone_number}@induservice.local"
        
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        if not extra_fields.get('email'):
            extra_fields['email'] = f"{phone_number}@induservice.local"
        return self._create_user(phone_number, password, **extra_fields)

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        if not extra_fields.get('email'):
            extra_fields['email'] = f"{phone_number}@admin.induservice.local"
        return self._create_user(phone_number, password, **extra_fields)


class User(AbstractUser, TimeStampedModel):
    class Role(models.TextChoices):
        # دریافت‌کنندگان خدمت (Buyer side)
        BUYER = 'buyer', _('مدیر کارخانه')
        TECHNICIAN = 'technician', _('تکنسین فنی')
        MAINTENANCE_MANAGER = 'maintenance_manager', _('مدیر نت')
        PROCUREMENT = 'procurement', _('بازرگانی/تدارکات')
        
        # خدمات‌دهندگان (Provider side)
        SELLER = 'seller', _('فروشنده (حقیقی)')
        SERVICE_PROVIDER = 'service_provider', _('خدمات‌دهنده (حقیقی)')
        COMPANY_SELLER = 'company_seller', _('شرکت فروشنده (حقوقی)')
        COMPANY_PROVIDER = 'company_provider', _('شرکت خدمات‌دهنده (حقوقی)')
        
        ADMIN = 'admin', _('مدیر سیستم')

    class PersonType(models.TextChoices):
        INDIVIDUAL = 'individual', _('حقیقی')
        LEGAL = 'legal', _('حقوقی')

    class SubRole(models.TextChoices):
        # زیرنقش‌های دریافت‌کننده
        FACTORY_MANAGER = 'factory_manager', _('مدیر کارخانه')
        TECHNICIAN_SUB = 'technician_sub', _('تکنسین')
        MAINTENANCE_MANAGER_SUB = 'maintenance_manager_sub', _('مدیر نت')
        PROCUREMENT_SUB = 'procurement_sub', _('بازرگانی')
        # زیرنقش‌های خدمات‌دهنده حقیقی
        ENGINEER = 'engineer', _('مهندس')
        REPAIRMAN = 'repairman', _('تعمیرکار')
        OTHER_INDIVIDUAL = 'other_individual', _('سایر')
        # زیرنقش‌های خدمات‌دهنده حقوقی
        CONTRACTOR = 'contractor', _('شرکت پیمانکاری')
        CONSULTANT = 'consultant', _('مشاور طراحی/مهندسی')
        OTHER_LEGAL = 'other_legal', _('سایر')

    username = None
    phone_number = models.CharField(_('شماره موبایل'), max_length=11, unique=True, db_index=True)
    email = models.EmailField(_('ایمیل'), blank=True, null=True, default=None)
    role = models.CharField(_('نقش کاربر'), max_length=20, choices=Role.choices, default=Role.BUYER, db_index=True)
    is_verified = models.BooleanField(_('تایید شده'), default=False)
    
    # فیلدهای جدید
    person_type = models.CharField(_('نوع شخصیت'), max_length=15, choices=PersonType.choices, null=True, blank=True)
    subrole = models.CharField(_('زیرنقش'), max_length=30, choices=SubRole.choices, null=True, blank=True)

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        verbose_name = _('کاربر')
        verbose_name_plural = _('کاربران')
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.phone_number} - {self.full_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.phone_number

    def has_role(self, role):
        return self.role == role


def certificate_upload_path(instance, filename):
    return f'certificates/{instance.user.id}/{filename}'


# apps/users/models.py - Profile 
class Profile(models.Model):
    """
    پروفایل جامع کاربر - همه نقش‌ها
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name=_('کاربر'))

    # ========================
    # نوع شخص (حقیقی / حقوقی)
    # ========================
    person_type = models.CharField(
        _('نوع شخص'),
        max_length=15,
        choices=[('individual', _('حقیقی')), ('legal', _('حقوقی (شرکت/کارخانه)'))],
        default='individual'
    )

    # ========================
    # اطلاعات حقیقی
    # ========================
    avatar = models.ImageField(_('تصویر پروفایل'), upload_to='avatars/', blank=True, null=True)
    national_id = models.CharField(_('کد ملی'), max_length=10, blank=True)
    bio = models.TextField(_('درباره من'), blank=True, max_length=500)
    years_of_experience = models.PositiveSmallIntegerField(_('سال تجربه'), default=0)
    specializations = models.TextField(_('تخصص‌ها'), blank=True, help_text='با کاما جدا کنید')
    education_level = models.CharField(_('مدرک تحصیلی'), max_length=30, blank=True,
        choices=[('diploma', 'دیپلم'), ('associate', 'فوق دیپلم'), ('bachelor', 'لیسانس'), ('master', 'فوق لیسانس'), ('phd', 'دکتری')])
    education_field = models.CharField(_('رشته تحصیلی'), max_length=100, blank=True)

    # ========================
    # مدارک
    # ========================
    certificate_title = models.CharField(_('عنوان مدرک'), max_length=200, blank=True)
    certificate_file = models.FileField(_('فایل مدرک'), upload_to='certifications/', blank=True, null=True)

    # ========================
    # سمت - دریافت‌کننده (متن آزاد)
    # ========================
    buyer_sub_role = models.CharField(_('سمت'), max_length=100, blank=True)

    # ========================
    # نوع خدمات‌دهنده
    # ========================
    provider_sub_role = models.CharField(_('نوع خدمات‌دهنده'), max_length=30, blank=True,
        choices=[
            ('engineer', _('مهندس مشاور')),
            ('repairman', _('تعمیرکار')),
            ('technician', _('تکنسین فنی')),
            ('other', _('سایر')),
        ])

    # ========================
    # تخصص و خدمات
    # ========================
    service_types_offered = models.JSONField(_('انواع خدمات'), default=list, blank=True)
    industries = models.JSONField(_('صنایع'), default=list, blank=True)
    machines = models.JSONField(_('دستگاه‌ها'), default=list, blank=True)
    manufacturing_processes = models.JSONField(_('فرآیندهای ساخت'), default=list, blank=True)
    materials = models.CharField(_('مواد'), max_length=300, blank=True)
    max_part_dimensions = models.CharField(_('حداکثر ابعاد'), max_length=50, blank=True)
    precision_mm = models.DecimalField(_('دقت (mm)'), max_digits=5, decimal_places=3, null=True, blank=True)

    # ========================
    # محدوده و ظرفیت
    # ========================
    service_area_provinces = models.JSONField(_('استان‌ها'), default=list, blank=True)
    max_distance_km = models.PositiveIntegerField(_('حداکثر فاصله'), default=50)
    response_time = models.CharField(_('زمان پاسخ'), max_length=20,
        choices=[('24/7', '۲۴ ساعته'), ('office_hours', 'ساعات اداری'), ('business_days', 'روزهای کاری')],
        default='office_hours')
    max_concurrent_requests = models.PositiveIntegerField(_('حداکثر درخواست همزمان'), default=3)
    has_vehicle = models.BooleanField(_('وسیله نقلیه'), default=False)

    # ========================
    # قیمت‌گذاری
    # ========================
    base_hourly_rate = models.DecimalField(_('دستمزد ساعتی'), max_digits=12, decimal_places=0, null=True, blank=True)
    base_daily_rate = models.DecimalField(_('دستمزد روزانه'), max_digits=12, decimal_places=0, null=True, blank=True)

    # ========================
    # امتیازات
    # ========================
    rating = models.DecimalField(_('امتیاز'), max_digits=3, decimal_places=1, default=0.0)
    rating_count = models.PositiveIntegerField(_('تعداد امتیاز'), default=0)
    completed_orders = models.PositiveIntegerField(_('سفارشات تکمیل شده'), default=0)
    total_revenue = models.DecimalField(_('درآمد کل (ریال)'), max_digits=14, decimal_places=0, default=0)
    avg_response_time_hours = models.DecimalField(_('میانگین زمان پاسخ (ساعت)'), max_digits=5, decimal_places=1, default=0.0)

    # ========================
    # شبکه‌های اجتماعی
    # ========================
    website = models.URLField(_('وبسایت'), blank=True)
    linkedin = models.URLField(_('لینکدین'), blank=True)
    instagram = models.CharField(_('اینستاگرام یا تلگرام'), max_length=100, blank=True)

    # ========================
    # اطلاعات حقوقی (شرکت/کارخانه)
    # ========================
    company_name = models.CharField(_('نام شرکت / کارخانه'), max_length=200, blank=True)
    company_registration_number = models.CharField(_('شماره ثبت'), max_length=50, blank=True)
    tax_id = models.CharField(_('شناسه ملی / کد اقتصادی'), max_length=50, blank=True)

    # ========================
    # رابطین (برای حقوقی)
    # ========================
    company_contacts = models.JSONField(_('رابطین'), default=list, blank=True,
        help_text='[{"name": "علی محمدی", "role": "مدیر فنی", "phone": "0912..."}]')

    # ========================
    # اطلاعات بانکی
    # ========================
    bank_name = models.CharField(_('نام بانک'), max_length=100, blank=True)
    bank_account_number = models.CharField(_('شماره حساب'), max_length=50, blank=True)
    bank_card_number = models.CharField(_('شماره کارت'), max_length=20, blank=True)
    bank_shaba = models.CharField(_('شماره شبا'), max_length=26, blank=True)
    bank_account_holder = models.CharField(_('نام صاحب حساب'), max_length=200, blank=True)

    # ========================
    # آدرس
    # ========================
    address = models.TextField(_('آدرس'), blank=True)
    city = models.CharField(_('شهر'), max_length=100, blank=True)
    province = models.CharField(_('استان'), max_length=100, blank=True)
    postal_code = models.CharField(_('کد پستی'), max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('پروفایل')
        verbose_name_plural = _('پروفایل‌ها')

    def __str__(self):
        return f"Profile of {self.user.phone_number}"

    # ========================
    # Properties
    # ========================
    @property
    def is_legal_entity(self):
        return self.person_type == 'legal'

    @property
    def is_service_provider(self):
        return self.user.role in ['seller', 'service_provider', 'company_seller', 'company_provider']

    @property
    def is_buyer(self):
        return self.user.role in ['buyer', 'technician', 'maintenance_manager', 'procurement']


# ========== 🆕 مدل‌های جدید ==========

class PortfolioItem(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio')
    title = models.CharField(_('عنوان'), max_length=200)
    description = models.TextField(_('توضیحات'), blank=True)
    image = models.ImageField(_('تصویر'), upload_to='portfolio/')

    class Meta:
        verbose_name = _('نمونه کار')
        verbose_name_plural = _('نمونه کارها')


class Certification(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certifications')
    title = models.CharField(_('عنوان'), max_length=200)
    file = models.FileField(_('فایل'), upload_to='certifications/')
    issued_by = models.CharField(_('صادر کننده'), max_length=200, blank=True)
    verified = models.BooleanField(_('تایید شده'), default=False)

    class Meta:
        verbose_name = _('مدرک')
        verbose_name_plural = _('مدارک')