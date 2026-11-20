from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('organizations', '0001_initial'),
        ('services', '0004_servicerequest_accepted_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicerequest',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='service_requests', to='organizations.organization', verbose_name='سازمان درخواست‌کننده'),
        ),
    ]
