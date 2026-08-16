"""apps/support/migrations/0001_initial.py"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        # افزودن dependency به orders در صورت وجود
        # ('orders', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Ticket',
            fields=[
                ('id',         models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('subject',    models.CharField(max_length=300, verbose_name='موضوع')),
                ('body',       models.TextField(verbose_name='متن اولیه')),
                ('status',     models.CharField(
                    choices=[('open','باز'),('in_review','در بررسی'),('resolved','حل شده'),('closed','بسته شده')],
                    default='open', max_length=15, verbose_name='وضعیت'
                )),
                ('priority',   models.CharField(
                    choices=[('low','پایین'),('medium','متوسط'),('high','بالا'),('urgent','فوری')],
                    default='medium', max_length=10, verbose_name='اولویت'
                )),
                ('category',   models.CharField(
                    choices=[('technical','فنی'),('payment','مالی'),('order','سفارش'),('account','حساب'),('other','سایر')],
                    default='other', max_length=20, verbose_name='دسته‌بندی'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user',       models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                                 related_name='tickets', to=settings.AUTH_USER_MODEL)),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                                                   related_name='assigned_tickets', to=settings.AUTH_USER_MODEL)),
            ],
            options={'verbose_name': 'تیکت', 'verbose_name_plural': 'تیکت‌ها', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='TicketMessage',
            fields=[
                ('id',         models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('body',       models.TextField(verbose_name='متن پیام')),
                ('attachment', models.FileField(blank=True, null=True, upload_to='support/attachments/%Y/%m/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ticket',     models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                                 related_name='messages', to='support.ticket')),
                ('sender',     models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                                 to=settings.AUTH_USER_MODEL)),
            ],
            options={'verbose_name': 'پیام تیکت', 'verbose_name_plural': 'پیام‌های تیکت', 'ordering': ['created_at']},
        ),
        migrations.CreateModel(
            name='Dispute',
            fields=[
                ('id',          models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('reason',      models.TextField(verbose_name='دلیل اختلاف')),
                ('resolution',  models.CharField(
                    choices=[('pending','در انتظار'),('to_provider','پرداخت به متخصص'),
                             ('to_buyer','بازگشت به خریدار'),('partial','تقسیم')],
                    default='pending', max_length=15, verbose_name='نتیجه'
                )),
                ('admin_note',  models.TextField(blank=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
                ('updated_at',  models.DateTimeField(auto_now=True)),
                ('raised_by',   models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                                   to=settings.AUTH_USER_MODEL)),
            ],
            options={'verbose_name': 'اختلاف', 'verbose_name_plural': 'اختلافات', 'ordering': ['-created_at']},
        ),
    ]
