import pandas as pd
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from users.models import User
from blog.models import BlogCategory, BlogPost, BlogTag


class Command(BaseCommand):
    help = 'وارد کردن مقالات و دسته‌بندی وبلاگ از فایل اکسل'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='مسیر فایل اکسل')
        parser.add_argument('--force', action='store_true', help='آپدیت رکوردهای موجود')

    def handle(self, *args, **options):
        file_path = options['file']
        force = options['force']

        self.stdout.write(self.style.SUCCESS(f'📂 وبلاگ: در حال خواندن {file_path}'))

        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('❌ کاربر ادمین یافت نشد'))
            return

        try:
            xls = pd.ExcelFile(file_path)

            # شیت ۱: دسته‌بندی وبلاگ
            if 'categories' in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name='categories').fillna('')
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

            # شیت ۲: تگ‌ها
            if 'tags' in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name='tags').fillna('')
                count = 0
                for _, row in df.iterrows():
                    name = str(row['name']).strip()
                    if not name:
                        continue
                    _, created = BlogTag.objects.get_or_create(
                        name=name,
                        defaults={'slug': slugify(name, allow_unicode=True)}
                    )
                    if created:
                        count += 1
                self.stdout.write(f'  ✅ تگ‌ها: {count} مورد')

            # شیت ۳: مقالات
            if 'posts' in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name='posts').fillna('')
                count = 0
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
                            'status': str(row.get('status', 'published')),
                            'read_time': int(row.get('read_time', 5)),
                            'is_featured': bool(row.get('is_featured', False)),
                            'meta_title': str(row.get('meta_title', title)),
                            'meta_description': str(row.get('meta_description', ''))[:300],
                            'meta_keywords': str(row.get('meta_keywords', '')),
                        }
                    )

                    if created or force:
                        # اضافه کردن تگ‌ها
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

            self.stdout.write(self.style.SUCCESS('✅ وبلاگ با موفقیت وارد شد!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ خطا: {e}'))