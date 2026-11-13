from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('users', '0001_initial')]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='registration_completed',
            field=models.BooleanField(default=False, verbose_name='ثبت‌نام تکمیل شده'),
        ),
    ]
