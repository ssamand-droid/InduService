import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [('users', '0001_initial')]

    operations = [
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')),
                ('name', models.CharField(max_length=200, verbose_name='نام ثبتی سازمان')),
                ('organization_type', models.CharField(choices=[('factory', 'کارخانه / دریافت‌کننده خدمات'), ('service_provider', 'شرکت خدمات‌دهنده'), ('supplier', 'تأمین‌کننده'), ('other', 'سازمان دیگر')], max_length=24, verbose_name='نوع سازمان')),
                ('registration_number', models.CharField(blank=True, max_length=50, verbose_name='شماره ثبت')),
                ('tax_id', models.CharField(blank=True, max_length=50, verbose_name='شناسه ملی / اقتصادی')),
                ('website', models.URLField(blank=True, verbose_name='وب‌سایت')),
                ('address', models.TextField(blank=True, verbose_name='نشانی')),
                ('city', models.CharField(blank=True, max_length=100, verbose_name='شهر')),
                ('province', models.CharField(blank=True, max_length=100, verbose_name='استان')),
                ('postal_code', models.CharField(blank=True, max_length=20, verbose_name='کد پستی')),
                ('verification_status', models.CharField(choices=[('unverified', 'تأیید نشده'), ('pending', 'در انتظار بررسی'), ('verified', 'تأیید شده'), ('rejected', 'رد شده')], default='unverified', max_length=20, verbose_name='وضعیت احراز سازمان')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='created_organizations', to=settings.AUTH_USER_MODEL, verbose_name='ایجادکننده')),
            ],
            options={
                'verbose_name': 'سازمان',
                'verbose_name_plural': 'سازمان‌ها',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='OrganizationMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')),
                ('role', models.CharField(choices=[('owner', 'مالک'), ('admin', 'مدیر سازمان'), ('requester', 'درخواست‌کننده خدمات'), ('approver', 'تأییدکننده'), ('member', 'عضو'), ('viewer', 'مشاهده‌گر')], default='member', max_length=16, verbose_name='نقش در سازمان')),
                ('is_active', models.BooleanField(default=True, verbose_name='عضویت فعال')),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='organizations.organization', verbose_name='سازمان')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='organization_memberships', to=settings.AUTH_USER_MODEL, verbose_name='کاربر')),
            ],
            options={
                'verbose_name': 'عضویت سازمانی',
                'verbose_name_plural': 'عضویت‌های سازمانی',
            },
        ),
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['organization_type', 'verification_status'], name='org_type_verify_idx'),
        ),
        migrations.AddConstraint(
            model_name='organizationmembership',
            constraint=models.UniqueConstraint(fields=('organization', 'user'), name='uniq_org_membership_user'),
        ),
        migrations.AddIndex(
            model_name='organizationmembership',
            index=models.Index(fields=['user', 'is_active', 'role'], name='org_user_active_role_idx'),
        ),
    ]
