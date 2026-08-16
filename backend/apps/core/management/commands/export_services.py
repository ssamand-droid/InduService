# apps/core/management/commands/export_services.py
import pandas as pd
from django.core.management.base import BaseCommand
from services.models import ServiceCategory, Service


class Command(BaseCommand):
    help = 'خروجی اکسل از خدمات و دسته‌بندی خدمات'

    def add_arguments(self, parser):
        parser.add_argument('output', type=str, help='مسیر فایل خروجی')

    def handle(self, *args, **options):
        output_path = options['output']

        # Export Service Categories
        categories = ServiceCategory.objects.all().values('name', 'description', 'is_active')
        df_cat = pd.DataFrame(list(categories))

        # Export Services
        services = Service.objects.select_related('category', 'provider')
        data = []
        for srv in services:
            data.append({
                'title': srv.title,
                'category': srv.category.name if srv.category else '',
                'service_type': srv.service_type,
                'pricing_model': srv.pricing_model,
                'base_price': srv.base_price,
                'hourly_rate': srv.hourly_rate,
                'description': srv.description,
                'requirements': srv.requirements,
                'estimated_duration_days': srv.estimated_duration_days,
                'warranty_months': srv.warranty_months,
                'service_area': srv.service_area,
                'is_remote': srv.is_remote,
                'is_onsite': srv.is_onsite,
                'is_active': srv.is_active,
            })
        df_srv = pd.DataFrame(data)

        # Save with distinct sheet names
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df_cat.to_excel(writer, sheet_name='categories_services', index=False)
            df_srv.to_excel(writer, sheet_name='services', index=False)

        self.stdout.write(self.style.SUCCESS(
            f'✅ خروجی اکسل خدمات در {output_path} ذخیره شد!\n'
            f'   🔧 شیت‌ها: categories_services ({len(df_cat)}), services ({len(df_srv)})'
        ))