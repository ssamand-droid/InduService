"""apps/system_setting/models.py — تنظیمات runtime پلتفرم"""
import uuid
from django.db import models
from django.core.cache import cache


class SettingType(models.TextChoices):
    GENERAL      = "general",      "عمومی"
    COMMISSION   = "commission",   "کمیسیون"
    PAYMENT      = "payment",      "پرداخت"
    SEO          = "seo",          "SEO"
    NOTIFICATION = "notification", "اعلان‌ها"


class SystemSetting(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key          = models.CharField(max_length=120, unique=True, verbose_name="کلید")
    value        = models.TextField(verbose_name="مقدار")
    title        = models.CharField(max_length=200, blank=True, verbose_name="عنوان فارسی")
    setting_type = models.CharField(max_length=20, choices=SettingType.choices,
                                    default=SettingType.GENERAL, verbose_name="نوع")
    is_public    = models.BooleanField(default=False,
                                       verbose_name="قابل مشاهده عمومی",
                                       help_text="اگر فعال باشد، بدون لاگین قابل دریافت است")
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    CACHE_PREFIX  = "sys_setting:"
    CACHE_TIMEOUT = 300  # 5 دقیقه

    class Meta:
        verbose_name        = "تنظیم سیستم"
        verbose_name_plural = "تنظیمات سیستم"
        ordering            = ["setting_type", "key"]

    def __str__(self):
        return f"{self.key} = {self.value[:40]}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # پاک کردن کش پس از تغییر
        cache.delete(f"{self.CACHE_PREFIX}{self.key}")
        cache.delete("sys_settings_public")
        cache.delete("sys_settings_all")

    # ── متدهای کلاسی برای دسترسی سریع ──────────────────────────────────────

    @classmethod
    def get(cls, key: str, default=None):
        """دریافت مقدار با کش."""
        cache_key = f"{cls.CACHE_PREFIX}{key}"
        cached    = cache.get(cache_key)
        if cached is not None:
            return cached
        try:
            val = cls.objects.get(key=key).value
            cache.set(cache_key, val, cls.CACHE_TIMEOUT)
            return val
        except cls.DoesNotExist:
            return default

    @classmethod
    def get_bool(cls, key: str, default: bool = False) -> bool:
        val = cls.get(key)
        if val is None:
            return default
        return val.lower() in ("true", "1", "yes", "on")

    @classmethod
    def get_int(cls, key: str, default: int = 0) -> int:
        val = cls.get(key)
        try:
            return int(val)
        except (TypeError, ValueError):
            return default

    @classmethod
    def get_float(cls, key: str, default: float = 0.0) -> float:
        val = cls.get(key)
        try:
            return float(val)
        except (TypeError, ValueError):
            return default

    @classmethod
    def set(cls, key: str, value, title: str = "", setting_type: str = "general",
            is_public: bool = False):
        """ایجاد یا به‌روزرسانی یک تنظیم."""
        obj, created = cls.objects.update_or_create(
            key=key,
            defaults={
                "value":        str(value),
                "title":        title or key,
                "setting_type": setting_type,
                "is_public":    is_public,
            }
        )
        return obj

    # ── تنظیمات رایج پلتفرم ─────────────────────────────────────────────────

    @classmethod
    def commission_rate(cls) -> float:
        return cls.get_float("COMMISSION_RATE", 10.0)

    @classmethod
    def matching_direct(cls) -> bool:
        return cls.get_bool("MATCHING_DIRECT_PROVIDER", True)

    @classmethod
    def matching_scenario(cls) -> bool:
        return cls.get_bool("MATCHING_SCENARIO_PROVIDERS", True)

    @classmethod
    def matching_advanced(cls) -> bool:
        return cls.get_bool("MATCHING_ENGINE_ADVANCED", False)

    @classmethod
    def otp_expire_minutes(cls) -> int:
        return cls.get_int("OTP_EXPIRE_MINUTES", 5)
