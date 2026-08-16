"""
مدل‌های سفارش، آیتم‌های سفارش و مراحل MRO
"""
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel, UUIDModel
from users.models import User
from products.models import Product

class Order(TimeStampedModel, UUIDModel):
    """
    مدل اصلی سفارش (می‌تواند ترکیبی از محصولات و خدمات باشد)
    """
    class OrderStatus(models.TextChoices):
        DRAFT = 'draft', _('پیش‌نویس')
        PENDING = 'pending', _('در انتظار تایید فروشنده')
        CONFIRMED = 'confirmed', _('تایید شده')
        PROCESSING = 'processing', _('در حال آماده‌سازی')
        SHIPPED = 'shipped', _('ارسال شده')
        DELIVERED = 'delivered', _('تحویل شده')
        COMPLETED = 'completed', _('تکمیل شده')
        CANCELLED = 'cancelled', _('لغو شده')
        RETURNED = 'returned', _('مرجوع شده')

    class PaymentStatus(models.TextChoices):
        UNPAID = 'unpaid', _('پرداخت نشده')
        PARTIAL = 'partial', _('پرداخت جزئی')
        PAID = 'paid', _('پرداخت شده')
        REFUNDED = 'refunded', _('بازپرداخت شده')

    buyer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='orders',
        limit_choices_to={'role': User.Role.BUYER},
        verbose_name=_('خریدار')
    )
    seller = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='sales_orders',
        limit_choices_to={'role__in': [User.Role.SELLER, User.Role.SERVICE_PROVIDER]},
        verbose_name=_('فروشنده')
    )

    order_number = models.CharField(_('شماره سفارش'), max_length=20, unique=True, db_index=True)
    status = models.CharField(_('وضعیت سفارش'), max_length=15, choices=OrderStatus.choices, default=OrderStatus.DRAFT)
    payment_status = models.CharField(_('وضعیت پرداخت'), max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)

    # مبالغ
    subtotal = models.DecimalField(_('جمع اقلام'), max_digits=14, decimal_places=0, default=0)
    shipping_cost = models.DecimalField(_('هزینه ارسال'), max_digits=12, decimal_places=0, default=0)
    tax = models.DecimalField(_('مالیات'), max_digits=12, decimal_places=0, default=0)
    discount = models.DecimalField(_('تخفیف'), max_digits=12, decimal_places=0, default=0)
    total = models.DecimalField(_('مبلغ کل'), max_digits=14, decimal_places=0, default=0)

    # اطلاعات ارسال
    shipping_address = models.TextField(_('آدرس ارسال'))
    shipping_city = models.CharField(_('شهر'), max_length=100)
    shipping_postal_code = models.CharField(_('کد پستی'), max_length=20)
    receiver_name = models.CharField(_('نام تحویل‌گیرنده'), max_length=200)
    receiver_phone = models.CharField(_('تلفن تحویل‌گیرنده'), max_length=15)

    # یادداشت‌ها
    buyer_note = models.TextField(_('یادداشت خریدار'), blank=True)
    seller_note = models.TextField(_('یادداشت فروشنده'), blank=True)
    admin_note = models.TextField(_('یادداشت مدیر'), blank=True)

    # تاریخ‌های مهم
    confirmed_at = models.DateTimeField(_('تاریخ تایید'), null=True, blank=True)
    shipped_at = models.DateTimeField(_('تاریخ ارسال'), null=True, blank=True)
    delivered_at = models.DateTimeField(_('تاریخ تحویل'), null=True, blank=True)
    completed_at = models.DateTimeField(_('تاریخ تکمیل'), null=True, blank=True)

    class Meta:
        verbose_name = _('سفارش')
        verbose_name_plural = _('سفارشات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"سفارش {self.order_number}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            from core.utils import generate_random_code
            self.order_number = f"ORD-{generate_random_code(8)}"
        super().save(*args, **kwargs)

    def calculate_totals(self):
        """محاسبه مجدد مبالغ بر اساس آیتم‌ها"""
        items = self.items.all()
        subtotal = sum(item.total_price for item in items)
        self.subtotal = subtotal
        self.total = subtotal + self.shipping_cost + self.tax - self.discount
        self.save(update_fields=['subtotal', 'total'])
        
        payment_receipt = models.ImageField(
        _('رسید پرداخت'),
        upload_to='payment_receipts/',
        blank=True,
        null=True,
        help_text='تصویر فیش واریزی'
    )
    payment_receipt = models.ImageField(
        _('رسید پرداخت'),
        upload_to='payment_receipts/',
        blank=True,
        null=True,
        help_text='تصویر فیش واریزی'
    )
    payment_verified = models.BooleanField(_('پرداخت تایید شده'), default=False)
    
    # به انتهای کلاس Order اضافه شود
    def generate_default_mro_steps(self, scenario):
        """
        بر اساس سناریوی انتخاب شده، مراحل پیش‌فرض MRO را ایجاد می‌کند.
        """
        from .models import MROWorkflowStep

        SCENARIO_STEPS = {
            'overhaul': [
                ('inspection', 'بازرسی اولیه و ارزیابی وضعیت'),
                ('disassembly', 'باز کردن و دمونتاژ'),
                ('cleaning', 'شستشو و تمیزکاری'),
                ('inspection_parts', 'بازرسی قطعات و تهیه BOM'),
                ('repair', 'تعمیر یا تعویض قطعات'),
                ('reassembly', 'مونتاژ و تنظیم'),
                ('testing', 'تست نهایی و کنترل کیفیت'),
                ('delivery', 'تحویل و گزارش نهایی'),
            ],
            'rewinding': [
                ('incoming_inspection', 'بررسی اولیه و تست عایقی'),
                ('stripping', 'سیم‌پیچی‌برداری'),
                ('core_test', 'تست هسته (Loop Test)'),
                ('winding', 'سیم‌پیچی جدید'),
                ('vpi', 'اشباع و پخت (VPI)'),
                ('final_test', 'تست نهایی (سرج، مقاومت، عایقی)'),
                ('painting', 'رنگ‌آمیزی و پلاک'),
                ('delivery', 'تحویل'),
            ],
            'machining': [
                ('drawing_approval', 'تایید نقشه فنی'),
                ('material_prep', 'تهیه مواد اولیه'),
                ('machining', 'ماشین‌کاری'),
                ('heat_treatment', 'عملیات حرارتی (در صورت نیاز)'),
                ('qc', 'کنترل ابعادی و کیفی'),
                ('delivery', 'تحویل به همراه گواهی'),
            ],
            'emergency_repair': [
                ('dispatch', 'اعزام تیم به محل'),
                ('diagnosis', 'عیب‌یابی'),
                ('temporary_fix', 'تعمیر موقت/اضطراری'),
                ('report', 'گزارش فنی'),
            ],
            'calibration': [
                ('as_found', 'ثبت مقادیر اولیه'),
                ('adjustment', 'تنظیم و واسنجی'),
                ('as_left', 'ثبت مقادیر نهایی'),
                ('certificate', 'صدور گواهی'),
            ],
            'pm': [
                ('inspection', 'بازرسی دوره‌ای'),
                ('lubrication', 'روغن‌کاری و گریس‌کاری'),
                ('adjustment', 'تنظیم و آچارکشی'),
                ('report', 'گزارش سرویس'),
            ],
            'ndt': [
                ('preparation', 'آماده‌سازی سطح'),
                ('testing', 'انجام تست (UT/RT/MT/PT)'),
                ('interpretation', 'تفسیر نتایج'),
                ('report', 'گزارش نهایی'),
            ],
            'oil_analysis': [
                ('sampling', 'نمونه‌گیری'),
                ('lab_test', 'آزمایشگاه'),
                ('analysis', 'تحلیل نتایج'),
                ('recommendation', 'توصیه‌ها'),
            ],
            'reverse_eng': [
                ('3d_scan', 'اسکن سه‌بعدی'),
                ('modeling', 'مدل‌سازی CAD'),
                ('drawing', 'تهیه نقشه ساخت'),
                ('delivery', 'تحویل فایل‌ها'),
            ],
            'automation': [
                ('backup', 'تهیه نسخه پشتیبان'),
                ('programming', 'برنامه‌نویسی'),
                ('simulation', 'شبیه‌سازی'),
                ('commissioning', 'راه‌اندازی'),
            ],
            'electronics_repair': [
                ('inspection', 'بازرسی و تست اولیه'),
                ('diagnosis', 'عیب‌یابی تخصصی'),
                ('component_replacement', 'تعویض قطعات معیوب'),
                ('testing', 'تست نهایی و کنترل کیفیت'),
                ('delivery', 'تحویل و گارانتی'),
            ],
        }

        steps = SCENARIO_STEPS.get(scenario, [
            ('pending', 'در انتظار شروع'),
            ('in_progress', 'در حال انجام'),
            ('completed', 'تکمیل شده'),
        ])

        for index, (step_type, title) in enumerate(steps, start=1):
            MROWorkflowStep.objects.create(
                order=self,
                step_type=step_type,
                title=title,
                order_index=index,
                status='pending'
            )
    
class OrderItem(TimeStampedModel):
    """
    آیتم‌های سفارش (محصولات)
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(_('تعداد'), validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(_('قیمت واحد'), max_digits=14, decimal_places=0)
    total_price = models.DecimalField(_('قیمت کل'), max_digits=14, decimal_places=0)
    asset_part = models.ForeignKey(
        'assets.AssetPart',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items',
        verbose_name=_('قطعه دارایی')
    )
    
    class Meta:
        verbose_name = _('آیتم سفارش')
        verbose_name_plural = _('آیتم‌های سفارش')

    def save(self, *args, **kwargs):
        if not self.unit_price:
            self.unit_price = self.product.final_price
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

class MROWorkflowStep(TimeStampedModel):
    """
    مراحل گردش کار MRO برای سفارش‌های شامل خدمات
    """
    class StepType(models.TextChoices):
        INSPECTION = 'inspection', _('بازرسی اولیه')
        DIAGNOSIS = 'diagnosis', _('عیب‌یابی')
        DISASSEMBLY = 'disassembly', _('باز کردن قطعات')
        REPAIR = 'repair', _('تعمیر')
        REPLACEMENT = 'replacement', _('تعویض قطعات')
        REASSEMBLY = 'reassembly', _('مونتاژ مجدد')
        TESTING = 'testing', _('تست و راه‌اندازی')
        DELIVERY = 'delivery', _('تحویل نهایی')

    class StepStatus(models.TextChoices):
        PENDING = 'pending', _('در انتظار')
        IN_PROGRESS = 'in_progress', _('در حال انجام')
        COMPLETED = 'completed', _('تکمیل شده')
        SKIPPED = 'skipped', _('رد شده')

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='mro_steps')
    step_type = models.CharField(_('نوع مرحله'), max_length=15, choices=StepType.choices)
    title = models.CharField(_('عنوان مرحله'), max_length=200)
    description = models.TextField(_('توضیحات'), blank=True)
    status = models.CharField(_('وضعیت'), max_length=15, choices=StepStatus.choices, default=StepStatus.PENDING)
    order_index = models.PositiveSmallIntegerField(_('ترتیب'))

    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='assigned_steps')
    started_at = models.DateTimeField(_('زمان شروع'), null=True, blank=True)
    completed_at = models.DateTimeField(_('زمان پایان'), null=True, blank=True)
    notes = models.TextField(_('یادداشت فنی'), blank=True)

    class Meta:
        verbose_name = _('مرحله MRO')
        verbose_name_plural = _('مراحل MRO')
        ordering = ['order', 'order_index']

    def __str__(self):
        return f"{self.order.order_number} - {self.title}"