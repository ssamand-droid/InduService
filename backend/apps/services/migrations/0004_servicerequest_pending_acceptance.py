# Generated for the explicit factory acceptance stage in the service workflow.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0003_servicerequestquote'),
    ]

    operations = [
        migrations.AlterField(
            model_name='servicerequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'در انتظار بررسی'),
                    ('reviewed', 'بررسی شده'),
                    ('quoted', 'قیمت داده شده'),
                    ('accepted', 'پذیرفته شده'),
                    ('rejected', 'رد شده'),
                    ('in_progress', 'در حال انجام'),
                    ('pending_acceptance', 'در انتظار تأیید کارخانه'),
                    ('completed', 'تأیید نهایی شده'),
                    ('cancelled', 'لغو شده'),
                ],
                default='pending',
                max_length=20,
                verbose_name='وضعیت',
            ),
        ),
    ]
