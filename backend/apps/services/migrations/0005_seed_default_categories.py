# Generated migration file
from django.db import migrations

def create_default_categories(apps, schema_editor):
    """ایجاد دسته‌بندی‌های پیش‌فرض خدمات صنعتی"""
    ServiceCategory = apps.get_model('services', 'ServiceCategory')
    
    default_categories = [
        {
            'name': 'تعمیرات الکتروموتور',
            'slug': 'electric-motor-repair',
            'description': 'تعمیر، سیم‌پیچی و اورهال انواع الکتروموتورهای صنعتی (高压،低压، DC)',
            'is_active': True,
        },
        {
            'name': 'ماشین‌کاری و ساخت قطعه',
            'slug': 'machining',
            'description': 'تراشکاری، فرزکاری، CNC، ساخت قطعات یدکی صنعتی',
            'is_active': True,
        },
        {
            'name': 'هیدرولیک و پنوماتیک',
            'slug': 'hydraulic-pneumatic',
            'description': 'تعمیر و نگهداری پمپ‌های هیدرولیک، شیرآلات، جک‌های پنوماتیک',
            'is_active': True,
        },
        {
            'name': 'ابزار دقیق و کالیبراسیون',
            'slug': 'instrumentation',
            'description': 'کالیبراسیون و تعمیر تجهیزات ابزار دقیق، سنسورها، ترانسمیترها',
            'is_active': True,
        },
        {
            'name': 'اورهال صنعتی',
            'slug': 'industrial-overhaul',
            'description': 'اورهال اساسی تجهیزات صنعتی، گیربکس‌ها، کمپرسورها',
            'is_active': True,
        },
        {
            'name': 'جوشکاری و تعمیرات',
            'slug': 'welding',
            'description': 'جوشکاری تخصصی، تعمیر مخازن، خطوط لوله، سازه‌های فلزی',
            'is_active': True,
        },
        {
            'name': 'آنالیز روغن و ارتعاشات',
            'slug': 'oil-analysis',
            'description': 'پایش وضعیت، آنالیز روغن، آنالیز ارتعاشات، ترموگرافی',
            'is_active': True,
        },
        {
            'name': 'تابلو برق و اتوماسیون',
            'slug': 'electrical-automation',
            'description': 'طراحی و تعمیر تابلوهای برق، PLC، درایو، اتوماسیون صنعتی',
            'is_active': True,
        },
        {
            'name': 'قطعات یدکی و مصرفی',
            'slug': 'spare-parts',
            'description': 'تامین قطعات یدکی، بلبرینگ، تسمه، فیلتر، روانکارها',
            'is_active': True,
        },
        {
            'name': 'کالیبراسیون ابزار دقیق',
            'slug': 'calibration',
            'description': 'کالیبراسیون فشار، دما، جریان، وزن، ابعاد',
            'is_active': True,
        },
        {
            'name': 'خدمات نصب و راه‌اندازی',
            'slug': 'installation',
            'description': 'نصب و راه‌اندازی ماشین‌آلات صنعتی، خطوط تولید',
            'is_active': True,
        },
        {
            'name': '📝 مشاوره فنی و مهندسی',
            'slug': 'engineering-consulting',
            'description': 'مشاوره در زمینه نگهداری و تعمیرات، بهره‌وری انرژی',
            'is_active': True,
        },
    ]
    
    created_count = 0
    for cat_data in default_categories:
        obj, created = ServiceCategory.objects.get_or_create(
            slug=cat_data['slug'],
            defaults=cat_data
        )
        if created:
            created_count += 1
            print(f"✅ ایجاد شد: {cat_data['name']}")
        else:
            print(f"⏩ از قبل موجود: {cat_data['name']}")
    
    print(f"\n🎉 {created_count} دسته‌بندی جدید ایجاد شد!")

def remove_default_categories(apps, schema_editor):
    """حذف دسته‌بندی‌های پیش‌فرض (در صورت نیاز برای rollback)"""
    ServiceCategory = apps.get_model('services', 'ServiceCategory')
    slugs = [
        'electric-motor-repair', 'machining', 'hydraulic-pneumatic',
        'instrumentation', 'industrial-overhaul', 'welding',
        'oil-analysis', 'electrical-automation', 'spare-parts',
        'calibration', 'installation', 'engineering-consulting'
    ]
    deleted_count = ServiceCategory.objects.filter(slug__in=slugs).delete()[0]
    print(f"🗑️ {deleted_count} دسته‌بندی حذف شد!")

class Migration(migrations.Migration):
    dependencies = [
        ('services', '0004_seed_service_categories'),  # وابسته به آخرین migration
    ]

    operations = [
        migrations.RunPython(create_default_categories, remove_default_categories),
    ]