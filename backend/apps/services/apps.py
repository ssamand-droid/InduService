from django.apps import AppConfig

class ServicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services'  # توجه: فقط services، بدون apps.
    verbose_name = 'خدمات MRO'