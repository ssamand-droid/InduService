import os

from django.core.wsgi import get_wsgi_application

# برای محیط Production لیارا
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'InduService.settings')

application = get_wsgi_application()