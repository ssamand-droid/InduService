from django.db import migrations

def create_default_plans(apps, schema_editor):
    Plan = apps.get_model('subscription', 'Plan')
    
    plans = [
        {
            'name': 'رایگان',
            'slug': 'free',
            'description': 'مناسب کارگاه‌های کوچک - ۵ دارایی رایگان',
            'price_monthly': 0,
            'price_yearly': 0,
            'max_assets': 5,
            'max_users': 1,
            'max_sensors': 0,
            'has_advanced_analytics': False,
            'has_predictive_maintenance': False,
            'has_bulk_import': False,
            'has_api_access': False,
            'has_priority_support': False,
            'sort_order': 1,
            'color': 'gray',
            'icon': 'package',
        },
        {
            'name': 'حرفه‌ای',
            'slug': 'pro',
            'description': 'مناسب کارخانه‌های متوسط - دارایی نامحدود',
            'price_monthly': 50000000,
            'price_yearly': 500000000,
            'max_assets': 999999,
            'max_users': 5,
            'max_sensors': 50,
            'has_advanced_analytics': True,
            'has_predictive_maintenance': True,
            'has_bulk_import': True,
            'has_api_access': False,
            'has_priority_support': False,
            'is_featured': True,
            'sort_order': 2,
            'color': 'blue',
            'icon': 'star',
        },
        {
            'name': 'سازمانی',
            'slug': 'enterprise',
            'description': 'مناسب شرکت‌های بزرگ - امکانات کامل',
            'price_monthly': 200000000,
            'price_yearly': 2000000000,
            'max_assets': 999999,
            'max_users': 999,
            'max_sensors': 9999,
            'has_advanced_analytics': True,
            'has_predictive_maintenance': True,
            'has_bulk_import': True,
            'has_api_access': True,
            'has_priority_support': True,
            'has_custom_branding': True,
            'sort_order': 3,
            'color': 'purple',
            'icon': 'building',
        },
    ]
    
    for plan_data in plans:
        Plan.objects.get_or_create(slug=plan_data['slug'], defaults=plan_data)


def remove_default_plans(apps, schema_editor):
    Plan = apps.get_model('subscription', 'Plan')
    Plan.objects.filter(slug__in=['free', 'pro', 'enterprise']).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('subscription', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(create_default_plans, remove_default_plans),
    ]