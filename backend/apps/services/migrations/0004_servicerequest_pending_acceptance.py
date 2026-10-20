# Generated for the explicit factory acceptance stage in the service workflow.
from django.db import migrations, models
from django.utils.translation import gettext_lazy as _


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
                    ('pending', _('در انتظار بررسی')),
                    ('reviewed', _('بررسی شده')),
                    ('quoted', _('قیمت داده شده')),
                    ('accepted', _('پذیرفته شده')),
                    ('rejected', _('رد شده')),
                    ('in_progress', _('در حال انجام')),
                    ('pending_acceptance', _('در انتظار تأیید کارخانه')),
                    ('completed', _('تأیید نهایی شده')),
                    ('cancelled', _('لغو شده')),
                ],
                default='pending',
                max_length=20,
                verbose_name=_('وضعیت'),
            ),
        ),
    ]
