import jdatetime
from django import template
from django.utils import timezone

register = template.Library()

@register.filter
def jalali_date(value):
    """تبدیل تاریخ میلادی به شمسی"""
    if not value:
        return ""
    # اگر datetime آگاه از زمان (timezone-aware) است، به timezone محلی تبدیل کن
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    jalali = jdatetime.datetime.fromgregorian(datetime=value)
    return jalali.strftime("%Y/%m/%d")

@register.filter
def jalali_datetime(value):
    """تبدیل datetime میلادی به شمسی"""
    if not value:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    jalali = jdatetime.datetime.fromgregorian(datetime=value)
    return jalali.strftime("%Y/%m/%d %H:%M")

@register.filter
def price_format(value):
    """فرمت قیمت به ریال با جداکننده"""
    if value is None:
        return "0"
    return "{:,}".format(int(value))

@register.filter
def price_toman(value):
    """فرمت قیمت به تومان با جداکننده"""
    if value is None:
        return "0"
    toman = int(value) / 10
    return "{:,}".format(int(toman))