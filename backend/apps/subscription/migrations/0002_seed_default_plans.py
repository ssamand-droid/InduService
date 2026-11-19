from django.db import migrations


def create_default_plans(apps, schema_editor):
    Plan = apps.get_model('subscription', 'Plan')
    defaults = [
        {
            'name': 'رایگان', 'slug': 'free', 'description': 'طرح پایه',
            'price_monthly': 0, 'price_yearly': 0, 'max_assets': 5,
            'max_users': 1, 'max_sensors': 0, 'sort_order': 0,
            'color': 'gray', 'icon': 'star',
        },
        {
            'name': 'حرفه‌ای', 'slug': 'pro', 'description': 'طرح حرفه‌ای',
            'price_monthly': 0, 'price_yearly': 0, 'max_assets': 10000,
            'max_users': 100, 'max_sensors': 1000, 'has_advanced_analytics': True,
            'has_predictive_maintenance': True, 'has_bulk_import': True,
            'has_api_access': True, 'has_priority_support': True,
            'sort_order': 1, 'color': 'blue', 'icon': 'zap',
        },
        {
            'name': 'سازمانی', 'slug': 'enterprise', 'description': 'طرح سازمانی',
            'price_monthly': 0, 'price_yearly': 0, 'max_assets': 100000,
            'max_users': 10000, 'max_sensors': 10000, 'has_advanced_analytics': True,
            'has_predictive_maintenance': True, 'has_bulk_import': True,
            'has_api_access': True, 'has_priority_support': True,
            'has_custom_branding': True, 'sort_order': 2,
            'color': 'purple', 'icon': 'building',
        },
    ]
    for plan in defaults:
        Plan.objects.update_or_create(slug=plan['slug'], defaults=plan)


def remove_default_plans(apps, schema_editor):
    Plan = apps.get_model('subscription', 'Plan')
    Plan.objects.filter(slug__in=['free', 'pro', 'enterprise'], subscriptions__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [('subscription', '0001_initial')]
    operations = [migrations.RunPython(create_default_plans, remove_default_plans)]
