"""Default system settings data migration."""
from django.db import migrations


DEFAULT_SETTINGS = [
    # کمیسیون
    {"key": "COMMISSION_RATE",              "value": "10",    "title": "درصد کمیسیون پلتفرم",        "setting_type": "commission", "is_public": False},
    {"key": "PREPAYMENT_RATE",              "value": "30",    "title": "درصد پیش‌پرداخت پیش‌فرض",    "setting_type": "commission", "is_public": False},
    # Matching
    {"key": "MATCHING_DIRECT_PROVIDER",     "value": "true",  "title": "ارسال به ارائه‌دهنده مستقیم", "setting_type": "general",    "is_public": False},
    {"key": "MATCHING_SCENARIO_PROVIDERS",  "value": "true",  "title": "ارسال به ارائه‌دهندگان سناریو","setting_type": "general",   "is_public": False},
    {"key": "MATCHING_ENGINE_ADVANCED",     "value": "false", "title": "Matching Engine پیشرفته",     "setting_type": "general",    "is_public": False},
    # OTP
    {"key": "OTP_EXPIRE_MINUTES",           "value": "5",     "title": "انقضای کد OTP (دقیقه)",       "setting_type": "general",    "is_public": False},
    # پرداخت
    {"key": "MIN_WITHDRAWAL_AMOUNT",        "value": "50000", "title": "حداقل مبلغ برداشت (تومان)",  "setting_type": "payment",    "is_public": True},
    {"key": "MAX_DEPOSIT_AMOUNT",           "value": "50000000","title": "حداکثر مبلغ واریز (تومان)", "setting_type": "payment",    "is_public": True},
    # سئو
    {"key": "SITE_NAME",                    "value": "صنعت‌یار", "title": "نام سایت",               "setting_type": "seo",        "is_public": True},
    {"key": "SITE_DESCRIPTION",             "value": "پلتفرم خدمات صنعتی", "title": "توضیحات سایت", "setting_type": "seo",        "is_public": True},
    # اعلان
    {"key": "SMS_ENABLED",                  "value": "true",  "title": "ارسال SMS فعال",              "setting_type": "notification","is_public": False},
    {"key": "EMAIL_ENABLED",                "value": "false", "title": "ارسال ایمیل فعال",            "setting_type": "notification","is_public": False},
]


def create_defaults(apps, schema_editor):
    SystemSetting = apps.get_model("system_setting", "SystemSetting")
    for s in DEFAULT_SETTINGS:
        SystemSetting.objects.get_or_create(key=s["key"], defaults=s)


def remove_defaults(apps, schema_editor):
    SystemSetting = apps.get_model("system_setting", "SystemSetting")
    keys = [s["key"] for s in DEFAULT_SETTINGS]
    SystemSetting.objects.filter(key__in=keys).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("system_setting", "0001_initial"),
    ]
    operations = [
        migrations.RunPython(create_defaults, remove_defaults),
    ]
