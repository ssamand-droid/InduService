# InduService/sitemap.py
import sys
from pathlib import Path
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

# ============================================================
# اضافه کردن مسیر apps به sys.path (برای اطمینان در sitemap.py)
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR / 'apps') not in sys.path:
    sys.path.insert(0, str(BASE_DIR / 'apps'))

# ===== حالا import‌ها به درستی کار می‌کنند =====
from products.models import Product
from services.models import Service

try:
    from blog.models import BlogPost
    HAS_BLOG = True
except ImportError:
    HAS_BLOG = False

class StaticViewSitemap(Sitemap):
    priority = 0.5
    changefreq = 'daily'

    def items(self):
        return ['home', 'products', 'services', 'blog', 'about', 'contact']

    def location(self, item):
        return reverse(item)

class ProductSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Product.objects.filter(is_active=True, is_deleted=False)

    def lastmod(self, obj):
        return obj.updated_at

class ServiceSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Service.objects.filter(is_active=True, is_deleted=False)

    def lastmod(self, obj):
        return obj.updated_at

if HAS_BLOG:
    class BlogSitemap(Sitemap):
        changefreq = 'weekly'
        priority = 0.7

        def items(self):
            return BlogPost.objects.filter(is_published=True)

        def lastmod(self, obj):
            return obj.updated_at