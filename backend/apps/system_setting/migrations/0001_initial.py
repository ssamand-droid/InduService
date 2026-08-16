"""
apps/system_setting/migrations/0001_initial.py
Auto-generated migration
"""
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='SystemSetting',
            fields=[
                ('id',           models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('key',          models.CharField(max_length=120, unique=True, verbose_name='کلید')),
                ('value',        models.TextField(verbose_name='مقدار')),
                ('title',        models.CharField(blank=True, max_length=200, verbose_name='عنوان فارسی')),
                ('setting_type', models.CharField(
                    choices=[('general','عمومی'),('commission','کمیسیون'),
                             ('payment','پرداخت'),('seo','SEO'),('notification','اعلان‌ها')],
                    default='general', max_length=20, verbose_name='نوع'
                )),
                ('is_public',    models.BooleanField(default=False, verbose_name='قابل مشاهده عمومی')),
                ('created_at',   models.DateTimeField(auto_now_add=True)),
                ('updated_at',   models.DateTimeField(auto_now=True)),
            ],
            options={'verbose_name': 'تنظیم سیستم', 'verbose_name_plural': 'تنظیمات سیستم', 'ordering': ['setting_type', 'key']},
        ),
    ]
