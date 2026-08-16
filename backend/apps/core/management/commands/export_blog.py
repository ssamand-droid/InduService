import pandas as pd
from django.core.management.base import BaseCommand
from blog.models import BlogCategory, BlogPost, BlogTag
from django.utils import timezone


class Command(BaseCommand):
    help = 'خروجی اکسل از مقالات و دسته‌بندی وبلاگ'

    def add_arguments(self, parser):
        parser.add_argument('output', type=str, help='مسیر فایل خروجی')

    def handle(self, *args, **options):
        output_path = options['output']

        # Export Categories
        categories = BlogCategory.objects.all().values('name', 'description', 'icon', 'is_active')
        df_cat = pd.DataFrame(list(categories))

        # Export Tags
        tags = BlogTag.objects.all().values('name')
        df_tags = pd.DataFrame(list(tags))

        # Export Posts
        posts = BlogPost.objects.select_related('category', 'author').prefetch_related('tags')
        data = []
        for post in posts:
            data.append({
                'title': post.title,
                'category': post.category.name if post.category else '',
                'excerpt': post.excerpt,
                'content': post.content,
                'status': post.status,
                'read_time': post.read_time,
                'is_featured': post.is_featured,
                'view_count': post.view_count,
                'meta_title': post.meta_title,
                'meta_description': post.meta_description,
                'meta_keywords': post.meta_keywords,
                'tags': ', '.join(post.tags.values_list('name', flat=True)),
                'published_at': post.published_at.replace(tzinfo=None) if post.published_at else None,
                'created_at': post.created_at.replace(tzinfo=None) if post.created_at else None,
            })
        df_posts = pd.DataFrame(data)

        # Save
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df_cat.to_excel(writer, sheet_name='categories', index=False)
            df_tags.to_excel(writer, sheet_name='tags', index=False)
            df_posts.to_excel(writer, sheet_name='posts', index=False)

        self.stdout.write(self.style.SUCCESS(
            f'✅ خروجی اکسل وبلاگ در {output_path} ذخیره شد!\n'
            f'   شیت‌ها: categories ({len(df_cat)}), tags ({len(df_tags)}), posts ({len(df_posts)})'
        ))