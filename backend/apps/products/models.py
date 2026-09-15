"""
مدل‌های مربوط به محصولات صنعتی، قطعات و کیت‌ها
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel, SoftDeleteModel
from users.models import User

class Category(TimeStampedModel):
    """دسته‌بندی محصولات صنعتی"""
    name = models.CharField(_('نام دسته محصول'), max_length=100)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children', verbose_name=_('دسته والد'))
    description = models.TextField(_('توضیحات'), blank=True)
    icon = models.ImageField(_('آیکون'), upload_to='categories/icons/', blank=True, null=True)
    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('دسته‌بندی محصول')
        verbose_name_plural = _('دسته‌بندی‌های محصولات')
        ordering = ['name']

    def __str__(self):
        if self.parent:
            return f'📦 {self.parent.name} > {self.name}'
        return f'📦 {self.name}'

class Brand(TimeStampedModel):
    """
    برند محصولات صنعتی (زیمنس، ABB، SKF و ...)
    """
    name = models.CharField(_('نام برند'), max_length=100, unique=True)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)
    logo = models.ImageField(_('لوگو'), upload_to='brands/logos/', blank=True, null=True)
    website = models.URLField(_('وبسایت'), blank=True)
    country = models.CharField(_('کشور سازنده'), max_length=50, blank=True)
    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('برند')
        verbose_name_plural = _('برندها')
        ordering = ['name']

    def __str__(self):
        return self.name

class TechnicalSpecification(TimeStampedModel):
    """
    مشخصات فنی عمومی که می‌توان به چند محصول نسبت داد (مثلاً توان، ولتاژ، جنس)
    """
    name = models.CharField(_('نام مشخصه'), max_length=100)
    unit = models.CharField(_('واحد'), max_length=30, blank=True)
    description = models.TextField(_('توضیحات'), blank=True)

    class Meta:
        verbose_name = _('مشخصه فنی')
        verbose_name_plural = _('مشخصات فنی')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.unit})" if self.unit else self.name

class Product(TimeStampedModel, SoftDeleteModel):
    """
    مدل اصلی محصول (می‌تواند قطعه یدکی، کیت کامل، مواد اولیه صنعتی باشد)
    """
    class ProductType(models.TextChoices):
        PART = 'part', _('قطعه یدکی')
        KIT = 'kit', _('کیت کامل')
        RAW = 'raw', _('مواد اولیه')
        TOOL = 'tool', _('ابزارآلات')

    class Condition(models.TextChoices):
        NEW = 'new', _('نو')
        REFURBISHED = 'refurbished', _('بازسازی شده')
        USED = 'used', _('کارکرده')

    seller = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='products',
        limit_choices_to={'role__in': [User.Role.SELLER, User.Role.SERVICE_PROVIDER]},
        verbose_name=_('فروشنده')
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
        verbose_name=_('دسته‌بندی')
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name=_('برند')
    )

    name = models.CharField(_('نام محصول'), max_length=200, db_index=True)
    slug = models.SlugField(_('اسلاگ'), unique=True, allow_unicode=True)
    sku = models.CharField(_('کد انبار'), max_length=50, unique=True, db_index=True)
    product_type = models.CharField(_('نوع محصول'), max_length=10, choices=ProductType.choices, default=ProductType.PART)
    condition = models.CharField(_('وضعیت'), max_length=12, choices=Condition.choices, default=Condition.NEW)

    description = models.TextField(_('توضیحات'))
    short_description = models.CharField(_('توضیح کوتاه'), max_length=300, blank=True)

    price = models.DecimalField(_('قیمت (ریال)'), max_digits=14, decimal_places=0, validators=[MinValueValidator(0)])
    discount_price = models.DecimalField(_('قیمت تخفیف‌خورده'), max_digits=14, decimal_places=0, blank=True, null=True)
    stock_quantity = models.PositiveIntegerField(_('موجودی'), default=0)
    min_order_quantity = models.PositiveIntegerField(_('حداقل سفارش'), default=1)
    lead_time_days = models.PositiveSmallIntegerField(_('زمان تامین (روز)'), default=1, help_text=_('مدت زمان آماده‌سازی تا ارسال'))

    is_active = models.BooleanField(_('فعال'), default=True)
    is_featured = models.BooleanField(_('ویژه'), default=False)

    # اطلاعات فنی و compatibility
    technical_specs = models.ManyToManyField(
        TechnicalSpecification,
        through='ProductSpecificationValue',
        related_name='products',
        verbose_name=_('مشخصات فنی')
    )

    # سئو
    meta_title = models.CharField(_('عنوان SEO'), max_length=150, blank=True)
    meta_description = models.TextField(_('توضیحات متا'), max_length=300, blank=True)
    meta_keywords = models.CharField(_('کلمات کلیدی'), max_length=255, blank=True)

    class Meta:
        verbose_name = _('محصول')
        verbose_name_plural = _('محصولات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['seller', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        company = self.seller.profile.company_name if hasattr(self.seller, 'profile') and self.seller.profile.company_name else ''
        return f"{self.name} - {company or self.seller.email}"

    @property
    def final_price(self):
        """قیمت نهایی با احتساب تخفیف"""
        return self.discount_price if self.discount_price else self.price

    @property
    def is_in_stock(self):
        return self.stock_quantity >= self.min_order_quantity

    @property
    def average_rating(self):
        # بعداً در اپ reviews پیاده‌سازی می‌شود
        return 0

class ProductSpecificationValue(models.Model):
    """
    جدول واسط برای نگهداری مقدار مشخصه فنی برای هر محصول
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    specification = models.ForeignKey(TechnicalSpecification, on_delete=models.CASCADE)
    value = models.CharField(_('مقدار'), max_length=200)

    class Meta:
        verbose_name = _('مقدار مشخصه')
        verbose_name_plural = _('مقادیر مشخصات')
        unique_together = ('product', 'specification')

    def __str__(self):
        return f"{self.product.name} - {self.specification.name}: {self.value}"

class ProductImage(TimeStampedModel):
    """
    تصاویر محصول (چند عکس برای هر محصول)
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(_('تصویر'), upload_to='products/images/')
    alt_text = models.CharField(_('متن جایگزین'), max_length=200, blank=True)
    is_primary = models.BooleanField(_('تصویر اصلی'), default=False)
    order = models.PositiveSmallIntegerField(_('ترتیب'), default=0)

    class Meta:
        verbose_name = _('تصویر محصول')
        verbose_name_plural = _('تصاویر محصول')
        ordering = ['order', '-is_primary']

    def save(self, *args, **kwargs):
        # اطمینان از اینکه فقط یک تصویر اصلی وجود دارد
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.product.name}"

class ProductDocument(TimeStampedModel):
    """
    مدارک فنی محصول (دیتاشیت، کاتالوگ، راهنما)
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(_('عنوان'), max_length=200)
    file = models.FileField(_('فایل'), upload_to='products/documents/')
    file_type = models.CharField(_('نوع فایل'), max_length=20, choices=(
        ('datasheet', 'دیتاشیت'),
        ('catalog', 'کاتالوگ'),
        ('manual', 'دفترچه راهنما'),
        ('certificate', 'گواهی'),
    ))

    class Meta:
        verbose_name = _('مدرک محصول')
        verbose_name_plural = _('مدارک محصول')

    def __str__(self):
        return f"{self.title} - {self.product.name}"