from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Email backend برای توسعه (console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# غیرفعال کردن الزام HTTPS در توسعه
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False