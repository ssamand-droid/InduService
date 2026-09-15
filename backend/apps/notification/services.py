# backend/apps/notification/services.py

from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from .models import Notification, NotificationTemplate
from users.models import User, Profile
from core.models import PlatformSetting


# ============================================================
# توابع پایه
# ============================================================

def create_notification(user, type, title, message, link='', extra_data=None):
    """ایجاد اعلان درون‌سیستمی"""
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        link=link,
        extra_data=extra_data or {}
    )


def send_email_notification(user, template_code, context):
    """ارسال ایمیل بر اساس قالب"""
    try:
        template = NotificationTemplate.objects.get(code=template_code, is_active=True)
    except NotificationTemplate.DoesNotExist:
        return False

    subject = template.subject
    body = template.render(context)
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
    )
    return True


# ============================================================
# توابع مرتبط با سفارش
# ============================================================

def notify_order_status_change(order):
    """اعلان تغییر وضعیت سفارش به خریدار و فروشنده"""
    create_notification(
        user=order.buyer,
        type='order',
        title=f"تغییر وضعیت سفارش {order.order_number}",
        message=f"سفارش شما به وضعیت {order.get_status_display()} تغییر یافت.",
        link=f"/dashboard/orders/{order.id}"
    )
    create_notification(
        user=order.seller,
        type='order',
        title=f"تغییر وضعیت سفارش {order.order_number}",
        message=f"سفارش {order.order_number} به وضعیت {order.get_status_display()} تغییر یافت.",
        link=f"/dashboard/orders/{order.id}"
    )


def notify_payment_verified(invoice):
    """اعلان تایید پرداخت"""
    create_notification(
        user=invoice.seller,
        type='payment',
        title='💰 پرداخت تایید شد',
        message=f'پرداخت فاکتور {invoice.invoice_number} تایید و به کیف پول شما واریز شد.',
        link='/wallet'
    )
    create_notification(
        user=invoice.buyer,
        type='payment',
        title='✅ پرداخت تایید شد',
        message=f'پرداخت شما برای فاکتور {invoice.invoice_number} تایید شد.',
        link=f'/dashboard/service-requests'
    )


def notify_service_completed(service_request):
    """اعلان تکمیل خدمت"""
    create_notification(
        user=service_request.buyer,
        type='service',
        title='🎉 خدمت تکمیل شد',
        message=f'خدمت "{service_request.title}" تکمیل شد. لطفاً نتیجه را بررسی کنید.',
        link=f'/dashboard/service-requests/{service_request.id}'
    )


def notify_force_majeure(service_request):
    """اعلان فورس ماژور"""
    create_notification(
        user=service_request.buyer,
        type='service',
        title='⚠️ اعلام فورس ماژور',
        message=f'ارائه‌دهنده برای "{service_request.title}" فورس ماژور اعلام کرد.\nدلیل: {service_request.force_majeure_reason}',
        link=f'/dashboard/service-requests/{service_request.id}'
    )
    for admin in User.objects.filter(role='admin'):
        create_notification(
            user=admin,
            type='service',
            title='⚠️ فورس ماژور',
            message=f'{service_request.service.provider.full_name} برای درخواست "{service_request.title}" فورس ماژور اعلام کرد.',
            link='/dashboard/admin'
        )


# ============================================================
# توابع مربوط به Matching Engine
# ============================================================

def get_matching_settings():
    """دریافت تنظیمات Matching Engine از دیتابیس"""
    return {
        'direct_provider': PlatformSetting.get_bool('MATCHING_DIRECT_PROVIDER', True),
        'scenario_providers': PlatformSetting.get_bool('MATCHING_SCENARIO_PROVIDERS', True),
        'advanced_engine': PlatformSetting.get_bool('MATCHING_ENGINE_ADVANCED', False),
    }


def find_matching_service(title, description, equipment_details='', extra_data=None, industry='', asset_name=''):
    """
    پیدا کردن سرویس مرتبط با درخواست بر اساس:
    - عنوان (title)
    - شرح مشکل (description)
    - مشخصات تجهیز (equipment_details)
    - اطلاعات تکمیلی (extra_data)
    - صنعت انتخاب شده (industry)
    - نام دستگاه از دارایی‌ها (asset_name)
    """
    from services.models import Service

    # ترکیب همه متن‌ها
    search_text_parts = [title, description]
    if equipment_details:
        search_text_parts.append(equipment_details)
    if extra_data and isinstance(extra_data, dict):
        for value in extra_data.values():
            if isinstance(value, str):
                search_text_parts.append(value)
    if industry:
        search_text_parts.append(industry)
    if asset_name:
        search_text_parts.append(asset_name)

    search_text = ' '.join(search_text_parts).lower()
    print(f"🔍 Searching for service matching: {search_text[:200]}...")

    # کلمات کلیدی مرتبط با صنعت نوشابه‌سازی
    beverage_industry_keywords = ['نوشابه', 'نوشابه‌سازی', 'آب معدنی', 'beverage', 'drink']

    # کلمات کلیدی مرتبط با دستگاه کراس مافای
    krauss_keywords = ['کراس مافای', 'krauss', 'maffei', 'krauss maffei', 'دستگاه تزریق']

    # لیست کلمات کلیدی برای تطابق
    keywords = {
        'emergency_repair': [
            'تعمیر', 'عیب یابی', 'عیبیابی', 'خراب', 'مشکل', 'سرویس', 'نگهداری',
            'لرزش', 'صدا', 'پمپ', 'موتور', 'الکتروموتور', 'بلبرینگ', 'گیربکس',
            'repair', 'maintenance', 'vibration', 'noise', 'pump', 'motor'
        ],
        'overhaul': ['اورهال', 'تعمیرات اساسی', 'overhaul'],
        'rewinding': ['سیم پیچی', 'سیم‌پیچی', 'الکتروموتور', 'موتور', 'rewinding'],
        'machining': ['تراشکاری', 'ماشین کاری', 'ماشین‌کاری', 'cnc', 'machining'],
        'calibration': ['کالیبراسیون', 'تنظیم', 'calibration'],
        'pm': ['نگهداری پیشگیرانه', 'نت', 'pm', 'پیشگیرانه'],
        'pdm': ['پایش وضعیت', 'پیش‌بینانه', 'pdm'],
        'commissioning': ['نصب', 'راه اندازی', 'راه‌اندازی', 'commissioning'],
        'inspection': ['بازرسی', 'تست', 'inspection', 'ndt', 'تست غیرمخرب'],
    }

    # ============================================================
    # روش 1: جستجو بر اساس نام دستگاه (اولویت بالا)
    # ============================================================
    if asset_name:
        for kw in krauss_keywords:
            if kw in asset_name.lower() or kw in search_text:
                krauss_services = Service.objects.filter(
                    Q(title__icontains='تزریق') |
                    Q(title__icontains='دستگاه') |
                    Q(description__icontains='تزریق'),
                    is_active=True,
                    is_deleted=False
                )
                if krauss_services.exists():
                    # اولویت با ارائه‌دهنده‌ای که قبلاً این دستگاه را تعمیر کرده
                    for svc in krauss_services:
                        if 'تزریق' in svc.title:
                            print(f"✅ Asset-based match (Krauss Maffei): {svc.title}")
                            return svc

    # ============================================================
    # روش 2: جستجو بر اساس صنعت (اولویت دوم)
    # ============================================================
    if industry:
        industry_lower = industry.lower()
        for kw in beverage_industry_keywords:
            if kw in industry_lower or kw in search_text:
                beverage_services = Service.objects.filter(
                    Q(title__icontains='نوشابه') |
                    Q(title__icontains='بسته‌بندی') |
                    Q(description__icontains='خوراکی'),
                    is_active=True,
                    is_deleted=False
                )
                if beverage_services.exists():
                    print(f"✅ Industry-based match: {beverage_services.first().title}")
                    return beverage_services.first()

    # ============================================================
    # روش 3: جستجوی مستقیم در سرویس‌ها
    # ============================================================
    matching_services = Service.objects.filter(
        Q(title__icontains=search_text) |
        Q(description__icontains=search_text),
        is_active=True,
        is_deleted=False
    )

    if matching_services.exists():
        best_match = matching_services.first()
        print(f"✅ Direct match found: {best_match.title}")
        return best_match

    # ============================================================
    # روش 4: جستجو بر اساس کلمات کلیدی
    # ============================================================
    for scenario, kw_list in keywords.items():
        for kw in kw_list:
            if kw in search_text:
                scenario_services = Service.objects.filter(
                    service_scenario=scenario,
                    is_active=True,
                    is_deleted=False
                )
                if scenario_services.exists():
                    for svc in scenario_services:
                        if 'تزریق' in svc.title or 'دستگاه' in svc.title:
                            print(f"✅ Keyword + scenario match: {svc.title} (scenario: {scenario})")
                            return svc
                    best_match = scenario_services.first()
                    print(f"✅ Scenario match: {best_match.title} (scenario: {scenario})")
                    return best_match

    # ============================================================
    # روش 5: جستجو بر اساس کلمه "دستگاه تزریق"
    # ============================================================
    if 'تزریق' in search_text or 'دستگاه' in search_text:
        injection_services = Service.objects.filter(
            Q(title__icontains='تزریق') | Q(title__icontains='دستگاه'),
            is_active=True,
            is_deleted=False
        )
        if injection_services.exists():
            best_match = injection_services.first()
            print(f"✅ Injection device match: {best_match.title}")
            return best_match

    print("⚠️ No matching service found")
    return None

def notify_matching_providers(service_request):
    """
    اعلان به خدمات‌دهندگان مرتبط با درخواست
    """
    from services.models import Service

    settings = get_matching_settings()
    print(f"🔍 Matching Settings for request #{service_request.id}: {settings}")

    matched_providers = set()

    # ============================================================
    # گزینه 1: ارائه‌دهنده مستقیم
    # ============================================================
    if settings['direct_provider'] and service_request.service and service_request.service.provider:
        if service_request.service.provider != service_request.buyer:
            matched_providers.add(service_request.service.provider.id)
            print(f"  ➕ Direct provider: {service_request.service.provider.phone_number}")

    # ============================================================
    # گزینه 2: ارائه‌دهندگان سناریو مرتبط
    # ============================================================
    if settings['scenario_providers'] and service_request.service:
        scenario = service_request.service.service_scenario
        scenario_providers = Service.objects.filter(
            service_scenario=scenario,
            is_active=True,
            is_deleted=False
        ).exclude(provider=service_request.buyer).select_related('provider').distinct()

        for svc in scenario_providers:
            if svc.provider:
                matched_providers.add(svc.provider.id)
                print(f"  ➕ Scenario provider: {svc.provider.phone_number} ({scenario})")

    # ============================================================
    # گزینه 3: Matching Engine پیشرفته (3 نفر برتر)
    # ============================================================
    if settings['advanced_engine']:
        try:
            from services.matching_engine import MatchingEngine
            top_providers = MatchingEngine.find_best_providers(service_request)

            for provider_data in top_providers:
                provider_id = provider_data.get('user_id')
                if provider_id and provider_id not in matched_providers:
                    matched_providers.add(provider_id)
                    print(f"  ➕ Advanced Engine: {provider_data.get('name')} (score: {provider_data.get('score')})")
        except Exception as e:
            print(f"⚠️ Advanced Matching Engine error: {e}")

    # محدودیت به حداکثر 5 نفر
    matched_providers = list(matched_providers)[:5]

    # ============================================================
    # ارسال اعلان
    # ============================================================
    count = 0
    for provider_id in matched_providers:
        try:
            provider = User.objects.get(id=provider_id)
            create_notification(
                user=provider,
                type='service_request',
                title='📢 درخواست جدید در حوزه تخصص شما',
                message=f'درخواست جدید "{service_request.title}" ثبت شده است.',
                link=f'/dashboard/service-requests/{service_request.id}',
                extra_data={
                    'request_id': service_request.id,
                    'request_title': service_request.title,
                    'settings': settings,
                }
            )
            count += 1
            print(f"✅ Notification sent to provider: {provider.phone_number}")
        except User.DoesNotExist:
            continue

    print(f"📨 Total notifications sent for request #{service_request.id}: {count}")
    return count