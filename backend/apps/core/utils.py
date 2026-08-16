# apps/core/utils.py

import random
import string
import jdatetime
from django.utils import timezone


def generate_random_code(length=8):
    """تولید کد تصادفی از حروف بزرگ و اعداد"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def get_client_ip(request):
    """استخراج IP کاربر از request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


# ========================
# تاریخ شمسی
# ========================

def to_jalali_date(value):
    """تبدیل تاریخ میلادی به شمسی (فقط تاریخ)"""
    if not value:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    try:
        jalali = jdatetime.datetime.fromgregorian(datetime=value)
        return jalali.strftime("%Y/%m/%d")
    except Exception:
        return str(value)


def to_jalali_datetime(value):
    """تبدیل datetime میلادی به شمسی (تاریخ و ساعت)"""
    if not value:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    try:
        jalali = jdatetime.datetime.fromgregorian(datetime=value)
        return jalali.strftime("%Y/%m/%d %H:%M")
    except Exception:
        return str(value)


# ========================
# فرمت قیمت
# ========================

def format_price_rial(value):
    """فرمت قیمت به ریال با جداکننده هزارگان"""
    if value is None:
        return "0"
    try:
        return "{:,}".format(int(value))
    except (ValueError, TypeError):
        return str(value)


def format_price_toman(value):
    """فرمت قیمت به تومان با جداکننده هزارگان"""
    if value is None:
        return "0"
    try:
        toman = int(value) // 10
        return "{:,}".format(toman)
    except (ValueError, TypeError):
        return str(value)