from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from core.models import TimeStampedModel
from users.models import User

class BlogCategory(TimeStampedModel):
    """دسته‌بندی مقالات"""
    name = models.CharField(_('نام دسته'), max_length=100)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)
    description = models.TextField(_('توضیحات'), blank=True)
    icon = models.CharField(_('آیکون'), max_length=10, blank=True, help_text='اموجی')
    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('دسته‌بندی وبلاگ')
        verbose_name_plural = _('دسته‌بندی‌های وبلاگ')
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class BlogTag(models.Model):
    """تگ‌های مقاله"""
    name = models.CharField(_('نام تگ'), max_length=50, unique=True)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)

    class Meta:
        verbose_name = _('تگ')
        verbose_name_plural = _('تگ‌ها')

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class BlogPost(TimeStampedModel):
    """مقاله وبلاگ"""
    class Status(models.TextChoices):
        DRAFT = 'draft', _('پیش‌نویس')
        PUBLISHED = 'published', _('منتشر شده')
        ARCHIVED = 'archived', _('آرشیو شده')

    title = models.CharField(_('عنوان'), max_length=200)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)
    author = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name=_('نویسنده'))
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, related_name='posts', verbose_name=_('دسته‌بندی'))
    tags = models.ManyToManyField(BlogTag, blank=True, related_name='posts', verbose_name=_('تگ‌ها'))

    excerpt = models.TextField(_('خلاصه'), max_length=500, help_text='برای نمایش در لیست و SEO')
    content = models.TextField(_('متن کامل'))

    featured_image = models.ImageField(_('تصویر شاخص'), upload_to='blog/', blank=True, null=True)
    status = models.CharField(_('وضعیت'), max_length=10, choices=Status.choices, default=Status.DRAFT)
    is_featured = models.BooleanField(_('ویژه'), default=False)
    read_time = models.PositiveSmallIntegerField(_('زمان مطالعه (دقیقه)'), default=5)

    # SEO Fields
    meta_title = models.CharField(_('عنوان SEO'), max_length=150, blank=True, help_text='اگر خالی باشد، عنوان مقاله استفاده می‌شود')
    meta_description = models.TextField(_('توضیحات متا'), max_length=300, blank=True)
    meta_keywords = models.CharField(_('کلمات کلیدی'), max_length=255, blank=True, help_text='با کاما جدا کنید')
    canonical_url = models.URLField(_('Canonical URL'), blank=True)
    og_image = models.ImageField(_('تصویر Open Graph'), upload_to='blog/og/', blank=True, null=True)
    noindex = models.BooleanField(_('noindex'), default=False, help_text='از ایندکس شدن توسط موتورهای جستجو جلوگیری کند')

    # Social
    view_count = models.PositiveIntegerField(_('تعداد بازدید'), default=0)
    published_at = models.DateTimeField(_('تاریخ انتشار'), null=True, blank=True)

    class Meta:
        verbose_name = _('مقاله')
        verbose_name_plural = _('مقالات')
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title, allow_unicode=True)
            # اطمینان از یکتایی
            counter = 1
            while BlogPost.objects.filter(slug=self.slug).exists():
                self.slug = f"{slugify(self.title, allow_unicode=True)}-{counter}"
                counter += 1
        super().save(*args, **kwargs)
        if not self.meta_title:
            self.meta_title = self.title
        if not self.meta_description:
            self.meta_description = self.excerpt[:300] if self.excerpt else self.title
        if not self.read_time:
            word_count = len(self.content.split())
            self.read_time = max(1, round(word_count / 200))
        super().save(*args, **kwargs)

    @property
    def estimated_read_time(self):
        return f"{self.read_time} دقیقه"