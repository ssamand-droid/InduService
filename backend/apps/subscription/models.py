from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TimeStampedModel
from users.models import User


class Plan(models.Model):
    """طرح‌های اشتراک"""
    name = models.CharField(_('نام طرح'), max_length=100)
    slug = models.SlugField(_('اسلاگ'), unique=True)
    description = models.TextField(_('توضیحات'), blank=True)
    
    # قیمت‌گذاری
    price_monthly = models.DecimalField(_('قیمت ماهانه (ریال)'), max_digits=14, decimal_places=0, default=0)
    price_yearly = models.DecimalField(_('قیمت سالانه (ریال)'), max_digits=14, decimal_places=0, default=0)
    
    # محدودیت‌ها
    max_assets = models.PositiveIntegerField(_('حداکثر دارایی'), default=5)
    max_users = models.PositiveIntegerField(_('حداکثر کاربر'), default=1)
    max_sensors = models.PositiveIntegerField(_('حداکثر سنسور'), default=0)
    
    # امکانات
    has_advanced_analytics = models.BooleanField(_('تحلیل پیشرفته'), default=False)
    has_predictive_maintenance = models.BooleanField(_('نگهداری پیش‌بینانه'), default=False)
    has_bulk_import = models.BooleanField(_('واردات انبوه'), default=False)
    has_api_access = models.BooleanField(_('دسترسی API'), default=False)
    has_priority_support = models.BooleanField(_('پشتیبانی ویژه'), default=False)
    has_custom_branding = models.BooleanField(_('برندینگ اختصاصی'), default=False)
    
    # وضعیت
    is_active = models.BooleanField(_('فعال'), default=True)
    is_featured = models.BooleanField(_('ویژه'), default=False)
    sort_order = models.PositiveIntegerField(_('ترتیب'), default=0)
    
    # رنگ و آیکون
    color = models.CharField(_('رنگ'), max_length=20, default='blue')
    icon = models.CharField(_('آیکون'), max_length=50, default='star')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('طرح اشتراک')
        verbose_name_plural = _('طرح‌های اشتراک')
        ordering = ['sort_order']
    
    def __str__(self):
        return self.name
    
    @property
    def monthly_price_display(self):
        if self.price_monthly == 0:
            return 'رایگان'
        return f'{self.price_monthly:,} ریال'
    
    @property
    def yearly_price_display(self):
        if self.price_yearly == 0:
            return 'رایگان'
        return f'{self.price_yearly:,} ریال'


class Subscription(TimeStampedModel):
    """اشتراک کاربر"""
    class Status(models.TextChoices):
        ACTIVE = 'active', _('فعال')
        EXPIRED = 'expired', _('منقضی شده')
        CANCELLED = 'cancelled', _('لغو شده')
        TRIAL = 'trial', _('آزمایشی')
    
    class BillingCycle(models.TextChoices):
        MONTHLY = 'monthly', _('ماهانه')
        YEARLY = 'yearly', _('سالانه')
    
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='subscriptions',
        verbose_name=_('کاربر')
    )
    plan = models.ForeignKey(
        Plan, on_delete=models.PROTECT, related_name='subscriptions',
        verbose_name=_('طرح')
    )
    
    status = models.CharField(
        _('وضعیت'), max_length=15, choices=Status.choices, default=Status.TRIAL
    )
    billing_cycle = models.CharField(
        _('دوره پرداخت'), max_length=10, choices=BillingCycle.choices, default=BillingCycle.MONTHLY
    )
    
    # تاریخ‌ها
    start_date = models.DateTimeField(_('تاریخ شروع'), default=timezone.now)
    end_date = models.DateTimeField(_('تاریخ پایان'), null=True, blank=True)
    trial_end_date = models.DateTimeField(_('پایان دوره آزمایشی'), null=True, blank=True)
    cancelled_at = models.DateTimeField(_('تاریخ لغو'), null=True, blank=True)
    
    # پرداخت
    auto_renew = models.BooleanField(_('تمدید خودکار'), default=False)
    invoice = models.ForeignKey(
        'payment.Invoice', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='subscriptions', verbose_name=_('فاکتور')
    )
    
    class Meta:
        verbose_name = _('اشتراک')
        verbose_name_plural = _('اشتراک‌ها')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f'{self.user.full_name} - {self.plan.name} ({self.get_status_display()})'
    
    @property
    def is_active_subscription(self):
        return self.status in [Subscription.Status.ACTIVE, Subscription.Status.TRIAL]
    
    @property
    def max_assets_allowed(self):
        if self.is_active_subscription:
            return self.plan.max_assets
        return 5  # حداقل رایگان
    
    @property
    def can_use_predictive(self):
        return self.is_active_subscription and self.plan.has_predictive_maintenance
    
    @property
    def can_bulk_import(self):
        return self.is_active_subscription and self.plan.has_bulk_import
    
    @classmethod
    def get_active_subscription(cls, user):
        """دریافت اشتراک فعال کاربر"""
        return cls.objects.filter(
            user=user,
            status__in=[cls.Status.ACTIVE, cls.Status.TRIAL]
        ).first()