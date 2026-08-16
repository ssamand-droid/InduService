"""
پیکربندی Celery برای پردازش غیرهمزمان (اعلان‌ها، ایمیل‌ها و کارهای سنگین)
"""
import os
from celery import Celery

# تنظیم متغیر محیطی برای استفاده از settings جنگو
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'InduService.settings')

app = Celery('InduService')

# خواندن تنظیمات از فایل settings با پیشوند CELERY
app.config_from_object('django.conf:settings', namespace='CELERY')

# کشف خودکار تسک‌ها در تمام اپ‌های نصب شده
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')