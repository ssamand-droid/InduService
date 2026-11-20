"""Production settings adjusted for an HTTP-only localhost test instance."""
from .production import *

# This instance is reachable only on the local machine and has no TLS proxy.
# Keep DEBUG=False and PostgreSQL, but avoid redirecting localhost to HTTPS.
DEBUG = False
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
SERVE_LOCAL_MEDIA = True
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# The built frontend is served by Vite preview on port 4173; its API points to
# this backend on port 8001.
CORS_ALLOWED_ORIGINS = [
    *CORS_ALLOWED_ORIGINS,
    'http://localhost:4173',
    'http://127.0.0.1:4173',
]
CSRF_TRUSTED_ORIGINS = [
    *CSRF_TRUSTED_ORIGINS,
    'http://localhost:4173',
    'http://127.0.0.1:4173',
]

# No project-level static directory exists in this local test environment.
# App-level static files remain discoverable through Django's app directories.
STATICFILES_DIRS = []
