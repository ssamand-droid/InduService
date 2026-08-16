from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel
from users.models import User
from products.models import Product
from services.models import Service, ServiceRequest
from orders.models import Order

class Review(TimeStampedModel):
    """مدل نظرات (قابل استفاده برای محصول یا خدمت)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', verbose_name=_('کاربر'))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews', verbose_name=_('محصول'))
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews', verbose_name=_('خدمت'))
    service_request = models.ForeignKey(ServiceRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews', verbose_name=_('درخواست خدمت'))
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('سفارش مرتبط'))

    rating = models.PositiveSmallIntegerField(_('امتیاز'), validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(_('عنوان'), max_length=200, blank=True)
    comment = models.TextField(_('متن نظر'), blank=True)
    pros = models.TextField(_('نقاط قوت'), blank=True)
    cons = models.TextField(_('نقاط ضعف'), blank=True)

    is_verified_purchase = models.BooleanField(_('خرید تایید شده'), default=False)
    is_approved = models.BooleanField(_('تایید شده'), default=True)
    helpful_count = models.PositiveIntegerField(_('تعداد مفید بودن'), default=0)
    not_helpful_count = models.PositiveIntegerField(_('تعداد غیرمفید'), default=0)

    # پاسخ فروشنده
    seller_response = models.TextField(_('پاسخ فروشنده'), blank=True)
    response_date = models.DateTimeField(_('تاریخ پاسخ'), null=True, blank=True)

    class Meta:
        verbose_name = _('نظر')
        verbose_name_plural = _('نظرات')
        ordering = ['-created_at']
        unique_together = [('user', 'product'), ('user', 'service')]

    def __str__(self):
        target = self.product or self.service or self.service_request
        return f'نظر {self.user.full_name} برای {target}'

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.product and not self.service and not self.service_request:
            raise ValidationError(_('باید محصول، خدمت یا درخواست خدمت مشخص شود.'))


class ReviewImage(TimeStampedModel):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(_('تصویر'), upload_to='reviews/')

    class Meta:
        verbose_name = _('تصویر نظر')
        verbose_name_plural = _('تصاویر نظرات')