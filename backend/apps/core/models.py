# backend/apps/core/models.py

from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class TimeStampedModel(models.Model):
    """مدل انتزاعی با created_at و updated_at"""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('تاریخ ایجاد'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('تاریخ بروزرسانی'))

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """مدل انتزاعی با UUID"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """مدل انتزاعی با قابلیت حذف نرم"""
    is_deleted = models.BooleanField(default=False, verbose_name=_('حذف شده؟'))
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name=_('تاریخ حذف'))

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self):
        super().delete()


class PlatformSetting(TimeStampedModel):
    """تنظیمات داینامیک پلتفرم"""
    class SettingType(models.TextChoices):
        GENERAL = 'general', _('عمومی')
        COMMISSION = 'commission', _('کمیسیون')
        PAYMENT = 'payment', _('پرداخت')
        SEO = 'seo', _('SEO')
        NOTIFICATION = 'notification', _('اعلان‌ها')
        APPEARANCE = 'appearance', _('ظاهری')
        SECURITY = 'security', _('امنیتی')

    key = models.CharField(_('کلید'), max_length=100, unique=True)
    value = models.TextField(_('مقدار'))
    title = models.CharField(_('عنوان'), max_length=200)
    description = models.TextField(_('توضیحات'), blank=True)
    setting_type = models.CharField(_('نوع'), max_length=20, choices=SettingType.choices, default=SettingType.GENERAL)
    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('تنظیمات پلتفرم')
        verbose_name_plural = _('تنظیمات پلتفرم')

    def __str__(self):
        return f'{self.title} ({self.key})'

    @classmethod
    def get(cls, key, default=None):
        """دریافت مقدار یک تنظیم"""
        setting = cls.objects.filter(key=key, is_active=True).first()
        return setting.value if setting else default

    @classmethod
    def get_int(cls, key, default=0):
        val = cls.get(key, str(default))
        try:
            return int(val)
        except (ValueError, TypeError):
            return default

    @classmethod
    def get_float(cls, key, default=0.0):
        val = cls.get(key, str(default))
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    @classmethod
    def get_bool(cls, key, default=False):
        """دریافت مقدار boolean یک تنظیم"""
        val = cls.get(key, str(default).lower())
        if val is None:
            return default
        return val.lower() in ['true', '1', 'yes', 'on']