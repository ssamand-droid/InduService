import pandas as pd
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from users.models import User
from products.models import Category, Brand, Product
from services.models import ServiceCategory, Service
from blog.models import BlogCategory, BlogPost, BlogTag


class Command(BaseCommand):
    help = 'وارد کردن داده‌های اولیه از فایل اکسل'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='مسیر فایل اکسل')
        parser.add_argument('--sheet', type=str, default=None, help='نام شیت')
        parser.add_argument('--force', action='store_true', help='حتی اگر وجود دارد، آپدیت کن')

    def handle(self, *args, **options):
        file_path = options['file']
        sheet_name = options['sheet']
        force = options['force']

        self.stdout.write(self.style.SUCCESS(f'📂 در حال خواندن فایل: {file_path}'))

        try:
            xls = pd.ExcelFile(file_path)
            sheets = [sheet_name] if sheet_name else xls.sheet_names

            for sheet in sheets:
                self.stdout.write(f'\n📋 پردازش شیت: {sheet}')
                df = pd.read_excel(file_path, sheet_name=sheet)
                # جایگزینی NaN با رشته خالی
                df = df.fillna('')
                self.process_sheet(sheet, df, force)

            self.stdout.write(self.style.SUCCESS('\n✅ همه داده‌ها با موفقیت وارد شدند!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ خطا: {e}'))
            import traceback
            traceback.print_exc()

    def process_sheet(self, sheet_name, df, force):
        sheet_map = {
            'categories': self.import_categories,
            'brands': self.import_brands,
            'products': self.import_products,
            'service_categories': self.import_service_categories,
            'services': self.import_services,
            'blog_categories': self.import_blog_categories,
            'blog_posts': self.import_blog_posts,
        }
        if sheet_name in sheet_map:
            sheet_map[sheet_name](df, force)
        else:
            self.stdout.write(self.style.WARNING(f'⚠️ شیت "{sheet_name}" ناشناخته'))

    # ==========================================
    # محصولات
    # ==========================================
    def import_categories(self, df, force):
        count = 0
        for _, row in df.iterrows():
            name = str(row['name']).strip()
            if not name:
                continue

            parent = None
            if row.get('parent') and str(row['parent']).strip():
                parent, _ = Category.objects.get_or_create(
                    name=str(row['parent']).strip(),
                    defaults={'slug': slugify(str(row['parent']).strip(), allow_unicode=True)}
                )

            defaults = {
                'parent': parent,
                'description': str(row.get('description', '')),
                'is_active': True,
            }

            if force:
                cat, created = Category.objects.update_or_create(
                    name=name,
                    defaults={**defaults, 'slug': slugify(name, allow_unicode=True)}
                )
            else:
                # slug یکتا
                base_slug = slugify(name, allow_unicode=True)
                slug = base_slug
                c = 1
                while Category.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{c}"
                    c += 1
                cat, created = Category.objects.get_or_create(
                    name=name,
                    defaults={**defaults, 'slug': slug}
                )

            if created:
                count += 1
            elif force:
                count += 1

        self.stdout.write(f'  ✅ دسته‌بندی محصولات: {count} مورد')

    def import_brands(self, df, force):
        count = 0
        for _, row in df.iterrows():
            name = str(row['name']).strip()
            if not name:
                continue

            base_slug = slugify(name, allow_unicode=True)
            slug = base_slug
            c = 1
            while Brand.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{c}"
                c += 1

            defaults = {
                'slug': slug,
                'country': str(row.get('country', '')),
                'website': str(row.get('website', '')),
                'is_active': True,
            }

            if force:
                _, created = Brand.objects.update_or_create(name=name, defaults=defaults)
            else:
                _, created = Brand.objects.get_or_create(name=name, defaults=defaults)

            if created or force:
                count += 1

        self.stdout.write(f'  ✅ برندها: {count} مورد')

    def import_products(self, df, force):
        count = 0
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('  ❌ کاربر ادمین یافت نشد'))
            return

        for _, row in df.iterrows():
            name = str(row['name']).strip()
            if not name:
                continue

            category = Category.objects.filter(name=str(row.get('category', ''))).first()
            brand = Brand.objects.filter(name=str(row.get('brand', ''))).first() if row.get('brand') else None

            sku = str(row.get('sku', f'SKU-{pd.Timestamp.now().timestamp()}'))
            base_slug = slugify(name, allow_unicode=True)
            slug = base_slug
            c = 1
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{c}"
                c += 1

            defaults = {
                'seller': admin_user,
                'category': category,
                'brand': brand,
                'slug': slug,
                'description': str(row.get('description', '')),
                'short_description': str(row.get('short_description', ''))[:300],
                'price': int(row.get('price', 0)),
                'stock_quantity': int(row.get('stock_quantity', 10)),
                'product_type': str(row.get('product_type', 'part')),
                'condition': str(row.get('condition', 'new')),
                'is_active': True,
            }

            if force:
                _, created = Product.objects.update_or_create(sku=sku, defaults=defaults)
            else:
                _, created = Product.objects.get_or_create(sku=sku, defaults=defaults)

            if created or force:
                count += 1

        self.stdout.write(f'  ✅ محصولات: {count} مورد')

    # ==========================================
    # خدمات
    # ==========================================
    def import_service_categories(self, df, force):
        count = 0
        for _, row in df.iterrows():
            name = str(row['name']).strip()
            if not name:
                continue

            base_slug = slugify(name, allow_unicode=True)
            slug = base_slug
            c = 1
            while ServiceCategory.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{c}"
                c += 1

            defaults = {
                'slug': slug,
                'description': str(row.get('description', '')),
                'is_active': True,
            }
            if force:
                _, created = ServiceCategory.objects.update_or_create(name=name, defaults=defaults)
            else:
                _, created = ServiceCategory.objects.get_or_create(name=name, defaults=defaults)

            if created or force:
                count += 1

        self.stdout.write(f'  ✅ دسته‌بندی خدمات: {count} مورد')

    def import_services(self, df, force):
        count = 0
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            return

        for _, row in df.iterrows():
            title = str(row['title']).strip()
            if not title:
                continue

            category = ServiceCategory.objects.filter(name=str(row.get('category', ''))).first()
            scenario = str(row.get('scenario', 'emergency_repair'))
            # اطمینان از معتبر بودن scenario
            valid_scenarios = ['emergency_repair', 'pm', 'pdm', 'commissioning', 'calibration',
                   'overhaul', 'rewinding', 'machining', 'special_test',
                   'tpi', 'ndt', 'oil_analysis',
                   'reverse_eng', 'engineering_consult', 'automation',
                   'critical_spare', 'surplus', 'loan',
                   'total_maint', 'performance', 'consignment']
            if scenario not in valid_scenarios:
                scenario = 'emergency_repair'

            base_slug = slugify(title, allow_unicode=True)
            slug = base_slug
            c = 1
            while Service.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{c}"
                c += 1

            defaults = {
                'provider': admin_user,
                'category': category,
                'slug': slug,
                'service_type': str(row.get('service_type', 'repair')),
                'service_scenario': scenario,
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

            # قیمت
            if row.get('base_price') and str(row['base_price']).strip() and str(row['base_price']) != '0':
                defaults['base_price'] = int(float(row['base_price']))
            if row.get('hourly_rate') and str(row['hourly_rate']).strip() and str(row['hourly_rate']) != '0':
                defaults['hourly_rate'] = int(float(row['hourly_rate']))

            if force:
                _, created = Service.objects.update_or_create(title=title, defaults=defaults)
            else:
                _, created = Service.objects.get_or_create(title=title, defaults=defaults)

            if created or force:
                count += 1

        self.stdout.write(f'  ✅ خدمات: {count} مورد')

    # ==========================================
    # وبلاگ
    # ==========================================
    def import_blog_categories(self, df, force):
        count = 0
        for _, row in df.iterrows():
            name = str(row['name']).strip()
            if not name:
                continue
            defaults = {
                'slug': slugify(name, allow_unicode=True),
                'description': str(row.get('description', '')),
                'icon': str(row.get('icon', '📝')),
                'is_active': True,
            }
            if force:
                _, created = BlogCategory.objects.update_or_create(name=name, defaults=defaults)
            else:
                _, created = BlogCategory.objects.get_or_create(name=name, defaults=defaults)
            if created or force:
                count += 1
        self.stdout.write(f'  ✅ دسته‌بندی وبلاگ: {count} مورد')

    def import_blog_posts(self, df, force):
        count = 0
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            return

        for _, row in df.iterrows():
            title = str(row['title']).strip()
            if not title:
                continue

            category = BlogCategory.objects.filter(name=str(row.get('category', ''))).first()
            post, created = BlogPost.objects.get_or_create(
                title=title,
                defaults={
                    'slug': slugify(title, allow_unicode=True),
                    'author': admin_user,
                    'category': category,
                    'excerpt': str(row.get('excerpt', ''))[:500],
                    'content': str(row.get('content', '')),
                    'status': 'published',
                    'read_time': int(row.get('read_time', 5)),
                    'is_featured': bool(row.get('is_featured', False)),
                    'meta_title': str(row.get('meta_title', title)),
                    'meta_description': str(row.get('meta_description', ''))[:300],
                    'meta_keywords': str(row.get('meta_keywords', '')),
                }
            )
            if created:
                if row.get('tags') and str(row['tags']).strip():
                    for tag_name in str(row['tags']).split(','):
                        tag_name = tag_name.strip()
                        if tag_name:
                            tag, _ = BlogTag.objects.get_or_create(
                                name=tag_name,
                                defaults={'slug': slugify(tag_name, allow_unicode=True)}
                            )
                            post.tags.add(tag)
                count += 1
        self.stdout.write(f'  ✅ مقالات وبلاگ: {count} مورد')