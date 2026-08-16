# apps/core/management/commands/import_services.py
import pandas as pd
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from users.models import User
from services.models import ServiceCategory, Service


class Command(BaseCommand):
    help = 'وارد کردن خدمات و دسته‌بندی خدمات از فایل اکسل'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='مسیر فایل اکسل')
        parser.add_argument('--force', action='store_true', help='آپدیت رکوردهای موجود')

    def handle(self, *args, **options):
        file_path = options['file']
        force = options['force']

        self.stdout.write(self.style.SUCCESS(f'📂 خدمات: در حال خواندن {file_path}'))

        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('❌ کاربر ادمین یافت نشد'))
            return

        try:
            xls = pd.ExcelFile(file_path)

            # شیت ۱: دسته‌بندی خدمات
            if 'categories_services' in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name='categories_services').fillna('')
                count = 0
                for _, row in df.iterrows():
                    name = str(row['name']).strip()
                    if not name: continue
                    defaults = {
                        'slug': slugify(name, allow_unicode=True),
                        'description': str(row.get('description', '')),
                        'is_active': True,
                    }
                    if force:
                        _, created = ServiceCategory.objects.update_or_create(name=name, defaults=defaults)
                    else:
                        _, created = ServiceCategory.objects.get_or_create(name=name, defaults=defaults)
                    if created or force: count += 1
                self.stdout.write(f'  🔧 دسته‌بندی خدمات: {count} مورد')
            else:
                self.stdout.write(self.style.WARNING('  ⚠️ شیت "categories_services" یافت نشد'))

            # شیت ۲: خدمات
            if 'services' in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name='services').fillna('')
                count = 0
                for _, row in df.iterrows():
                    title = str(row['title']).strip()
                    if not title: continue

                    category = ServiceCategory.objects.filter(name=str(row.get('category', ''))).first()

                    defaults = {
                        'provider': admin_user,
                        'category': category,
                        'slug': slugify(title, allow_unicode=True),
                        'service_type': str(row.get('service_type', 'repair')),
                        'pricing_model': str(row.get('pricing_model', 'quotation')),
                        'description': str(row.get('description', '')),
                        'requirements': str(row.get('requirements', '')),
                        'estimated_duration_days': int(row.get('estimated_duration_days', 1)),
                        'warranty_months': int(row.get('warranty_months', 0)),
                        'service_area': str(row.get('service_area', 'سراسر کشور')),
                        'is_remote': bool(row.get('is_remote', False)),
                        'is_onsite': bool(row.get('is_onsite', True)),
                        'is_active': True,
                    }

                    if row.get('base_price') and str(row['base_price']).strip() and str(row['base_price']) != '0':
                        defaults['base_price'] = int(float(row['base_price']))
                    if row.get('hourly_rate') and str(row['hourly_rate']).strip() and str(row['hourly_rate']) != '0':
                        defaults['hourly_rate'] = int(float(row['hourly_rate']))

                    if force:
                        _, created = Service.objects.update_or_create(title=title, defaults=defaults)
                    else:
                        _, created = Service.objects.get_or_create(title=title, defaults=defaults)

                    if created or force: count += 1
                self.stdout.write(f'  🔧 خدمات: {count} مورد')
            else:
                self.stdout.write(self.style.WARNING('  ⚠️ شیت "services" یافت نشد'))

            self.stdout.write(self.style.SUCCESS('✅ خدمات با موفقیت وارد شدند!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ خطا: {e}'))