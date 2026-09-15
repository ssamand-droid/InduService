from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel
from users.models import User

class Notification(TimeStampedModel):
    """
    اعلان‌های درون‌سیستمی
    """
    class NotificationType(models.TextChoices):
        ORDER = 'order', _('سفارش')
        SERVICE = 'service', _('خدمات')
        PAYMENT = 'payment', _('پرداخت')
        SERVICE_REQUEST = 'service_request', _('درخواست خدمت')
        SYSTEM = 'system', _('سیستمی')
        REVIEW = 'review', _('نظر')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(_('نوع'), max_length=20, choices=NotificationType.choices)
    title = models.CharField(_('عنوان'), max_length=200)
    message = models.TextField(_('پیام'))
    link = models.URLField(_('لینک'), blank=True)
    is_read = models.BooleanField(_('خوانده شده'), default=False)
    read_at = models.DateTimeField(_('زمان خواندن'), null=True, blank=True)

    # داده‌های اضافی برای frontend
    extra_data = models.JSONField(_('داده‌های اضافی'), default=dict, blank=True)

    class Meta:
        verbose_name = _('اعلان')
        verbose_name_plural = _('اعلان‌ها')
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'is_read'])]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

class NotificationTemplate(models.Model):
    """
    قالب‌های پیام برای ایمیل و اعلان‌ها
    """
    code = models.CharField(_('کد'), max_length=50, unique=True)
    name = models.CharField(_('نام'), max_length=100)
    subject = models.CharField(_('موضوع'), max_length=200)
    body = models.TextField(_('متن'), help_text=_('می‌توانید از {{variable}} استفاده کنید'))
    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('قالب اعلان')
        verbose_name_plural = _('قالب‌های اعلان')

    def __str__(self):
        return self.name

    def render(self, context):
        """جایگزینی متغیرها در متن"""
        from django.template import Template, Context
        template = Template(self.body)
        return template.render(Context(context))