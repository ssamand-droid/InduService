from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

User = get_user_model()


class AssetCategory(models.Model):
    """دسته‌بندی دارایی‌ها"""
    name = models.CharField(max_length=200, verbose_name="نام دسته")
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )
    icon = models.CharField(max_length=50, default='FaCog')
    description = models.TextField(blank=True)
    default_maintenance_interval_days = models.PositiveIntegerField(default=90)

    class Meta:
        verbose_name = "دسته‌بندی دارایی"
        verbose_name_plural = "دسته‌بندی‌های دارایی"
        ordering = ['name']

    def __str__(self):
        return self.name


class Asset(models.Model):
    """مدل اصلی دارایی فیزیکی"""
    CRITICALITY_CHOICES = [
        ('critical', 'بحرانی - توقف کامل خط تولید'),
        ('high', 'بالا - تأثیر مستقیم بر تولید'),
        ('medium', 'متوسط - تأثیر غیرمستقیم'),
        ('low', 'پایین - بدون تأثیر فوری'),
    ]
    STATUS_CHOICES = [
        ('operational', 'در حال کار'),
        ('degraded', 'کاهش عملکرد'),
        ('maintenance', 'در دست تعمیر'),
        ('standby', 'آماده به کار'),
        ('retired', 'از رده خارج'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    category = models.ForeignKey(AssetCategory, on_delete=models.SET_NULL, null=True, related_name='assets')

    name = models.CharField(max_length=300, verbose_name="نام دستگاه")
    tag_number = models.CharField(max_length=100, unique=True, verbose_name="شماره پلاک/تگ")
    brand = models.CharField(max_length=200, blank=True, verbose_name="برند")
    model_number = models.CharField(max_length=200, blank=True, verbose_name="شماره مدل")
    serial_number = models.CharField(max_length=200, blank=True, verbose_name="شماره سریال")
    manufacturer = models.CharField(max_length=300, blank=True, verbose_name="سازنده")
    year_of_manufacture = models.PositiveIntegerField(null=True, blank=True)
    location = models.CharField(max_length=400, blank=True, verbose_name="موقعیت نصب")
    production_line = models.CharField(max_length=200, blank=True, verbose_name="خط تولید")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='operational')
    criticality = models.CharField(max_length=20, choices=CRITICALITY_CHOICES, default='medium')

    main_image = models.ImageField(upload_to='assets/images/', null=True, blank=True)
    nameplate_image = models.ImageField(upload_to='assets/nameplates/', null=True, blank=True)

    health_index = models.FloatField(
        default=100.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="شاخص سلامت (0-100)"
    )

    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    hourly_downtime_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="هزینه هر ساعت توقف (ریال)")

    installation_date = models.DateField(null=True, blank=True)
    last_maintenance_date = models.DateTimeField(null=True, blank=True)
    next_maintenance_date = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True, verbose_name="یادداشت‌های فنی")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "دارایی فیزیکی"
        verbose_name_plural = "دارایی‌های فیزیکی"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['tag_number']),
        ]

    def __str__(self):
        return f"{self.name} ({self.tag_number})"

    def calculate_health_index(self):
        """محاسبه هوشمند شاخص سلامت"""
        from datetime import date
        score = 100.0

        if self.installation_date:
            years_old = (date.today() - self.installation_date).days / 365
            age_penalty = min(years_old * 2, 30)
            score -= age_penalty

        if self.last_maintenance_date:
            days_since_maintenance = (timezone.now() - self.last_maintenance_date).days
            maintenance_penalty = min(days_since_maintenance * 0.1, 20)
            score -= maintenance_penalty

        recent_failures = self.maintenance_logs.filter(
            maintenance_type='corrective',
            created_at__gte=timezone.now() - timezone.timedelta(days=180)
        ).count()
        score -= recent_failures * 5

        return max(score, 0)


class AssetPart(models.Model):
    """قطعات یدکی مربوط به هر دارایی"""
    CRITICALITY_CHOICES = [
        ('vital', 'حیاتی - بدون جایگزین'),
        ('important', 'مهم - جایگزین محدود'),
        ('standard', 'استاندارد - قابل تهیه آسان'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='parts')
    name = models.CharField(max_length=300, verbose_name="نام قطعه")
    part_number = models.CharField(max_length=200, verbose_name="شماره فنی قطعه")
    stock_quantity = models.PositiveIntegerField(default=0, verbose_name="موجودی فعلی")
    min_stock_alert = models.PositiveIntegerField(default=1, verbose_name="حداقل موجودی هشدار")
    criticality = models.CharField(max_length=20, choices=CRITICALITY_CHOICES, default='standard')
    specifications = models.JSONField(default=dict, blank=True)
    replacement_lead_time_days = models.PositiveIntegerField(default=7, verbose_name="زمان تأمین (روز)")
    image = models.ImageField(upload_to='assets/parts/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "قطعه یدکی"
        verbose_name_plural = "قطعات یدکی"
        unique_together = ['asset', 'part_number']

    def __str__(self):
        return f"{self.part_number} - {self.name}"


class AssetDocument(models.Model):
    """اسناد و مدارک دارایی"""
    DOCUMENT_TYPES = [
        ('manual', 'دفترچه راهنما'),
        ('catalog', 'کاتالوگ فنی'),
        ('drawing', 'نقشه فنی'),
        ('warranty', 'گارانتی'),
        ('inspection', 'گزارش بازرسی'),
        ('other', 'سایر'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=300)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='assets/documents/')
    version = models.CharField(max_length=20, default='1.0')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    upload_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "سند دارایی"
        verbose_name_plural = "اسناد دارایی"
        ordering = ['-upload_date']


class AssetHealthLog(models.Model):
    """گزارش‌های دوره‌ای سلامت دارایی"""
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='health_logs')
    health_index = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    vibration_level = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    technician_notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "گزارش سلامت"
        verbose_name_plural = "گزارش‌های سلامت"
        ordering = ['-recorded_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.asset.health_index = self.asset.calculate_health_index()
        self.asset.save()


class AssetMaintenanceLog(models.Model):
    """تاریخچه تعمیرات و نگهداری"""
    MAINTENANCE_TYPES = [
        ('preventive', 'نگهداری پیشگیرانه'),
        ('corrective', 'تعمیرات اصلاحی'),
        ('predictive', 'تعمیرات پیش‌بینانه'),
        ('emergency', 'تعمیرات اضطراری'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_logs')
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPES)
    title = models.CharField(max_length=300)
    description = models.TextField()
    labor_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    parts_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    downtime_hours = models.FloatField(default=0)
    technician = models.CharField(max_length=200, blank=True)
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    replaced_parts = models.ManyToManyField(AssetPart, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "گزارش تعمیرات"
        verbose_name_plural = "گزارش‌های تعمیرات"
        ordering = ['-created_at']

    @property
    def total_cost(self):
        return self.labor_cost + self.parts_cost


class AssetAlert(models.Model):
    """هشدارهای هوشمند دارایی"""
    SEVERITY_CHOICES = [
        ('info', 'اطلاع‌رسانی'),
        ('warning', 'هشدار'),
        ('critical', 'بحرانی'),
    ]
    ALERT_TYPES = [
        ('stock_low', 'موجودی کم'),
        ('maintenance_due', 'موعد نگهداری'),
        ('performance_drop', 'کاهش عملکرد'),
        ('failure_prediction', 'پیش‌بینی خرابی'),
        ('budget_exceeded', 'تجاوز از بودجه'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    title = models.CharField(max_length=300)
    message = models.TextField()
    recommended_action = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    is_actioned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "هشدار دارایی"
        verbose_name_plural = "هشدارهای دارایی"
        ordering = ['-created_at']


class DigitalTwinHotspot(models.Model):
    """نقاط حساس روی تصویر دارایی"""
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='hotspots')
    label = models.CharField(max_length=200)
    part = models.ForeignKey(AssetPart, on_delete=models.SET_NULL, null=True, blank=True, related_name='hotspots')
    x_position = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    y_position = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    icon = models.CharField(max_length=50, default='FaCircle')
    color = models.CharField(max_length=20, default='#EF4444')

    class Meta:
        verbose_name = "نقطه حساس"
        verbose_name_plural = "نقاط حساس"


class AssetImportBatch(models.Model):
    """بسته واردات انبوه"""
    STATUS_CHOICES = [
        ('pending', 'در انتظار پردازش'),
        ('processing', 'در حال پردازش'),
        ('completed', 'تکمیل شده'),
        ('partial', 'تکمیل با خطا'),
        ('failed', 'ناموفق'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='import_batches')
    file = models.FileField(upload_to='imports/excel/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_rows = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    error_log = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "بسته واردات"
        verbose_name_plural = "بسته‌های واردات"
        ordering = ['-created_at']


class MaintenanceImportBatch(models.Model):
    """واردات دسته‌جمعی سوابق تعمیرات"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='imports/maintenance/')
    status = models.CharField(max_length=20, default='pending')
    total_records = models.PositiveIntegerField(default=0)
    imported_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    error_log = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "واردات سوابق تعمیرات"
        verbose_name_plural = "واردات‌های سوابق تعمیرات"
        

# ============ مدل‌های همزاد دیجیتال ============

class SensorType(models.TextChoices):
    """انواع سنسورهای صنعتی"""
    VIBRATION = 'vibration', 'سنسور ارتعاش'
    TEMPERATURE = 'temperature', 'سنسور دما'
    PRESSURE = 'pressure', 'سنسور فشار'
    FLOW = 'flow', 'سنسور جریان (Flow)'
    RPM = 'rpm', 'سنسور دور (RPM)'
    CURRENT = 'current', 'سنسور جریان الکتریکی'
    VOLTAGE = 'voltage', 'سنسور ولتاژ'
    OIL_QUALITY = 'oil_quality', 'سنسور کیفیت روغن'
    HUMIDITY = 'humidity', 'سنسور رطوبت'
    NOISE = 'noise', 'سنسور صدا'


class Sensor(models.Model):
    """سنسورهای متصل به دارایی"""
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='sensors'
    )
    name = models.CharField(max_length=200, verbose_name="نام سنسور")
    sensor_type = models.CharField(
        max_length=20,
        choices=SensorType.choices,
        verbose_name="نوع سنسور"
    )
    identifier = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="شناسه یکتا",
        help_text="MAC Address یا شناسه IoT"
    )
    
    # مشخصات فنی
    manufacturer = models.CharField(max_length=200, blank=True)
    model = models.CharField(max_length=200, blank=True)
    unit = models.CharField(max_length=20, verbose_name="واحد اندازه‌گیری", help_text="مثال: °C, mm/s, bar")
    
    # آستانه‌های هشدار
    warning_threshold_low = models.FloatField(null=True, blank=True, verbose_name="آستانه هشدار پایین")
    warning_threshold_high = models.FloatField(null=True, blank=True, verbose_name="آستانه هشدار بالا")
    critical_threshold_low = models.FloatField(null=True, blank=True, verbose_name="آستانه بحرانی پایین")
    critical_threshold_high = models.FloatField(null=True, blank=True, verbose_name="آستانه بحرانی بالا")
    
    # وضعیت
    is_active = models.BooleanField(default=True)
    last_reading = models.FloatField(null=True, blank=True, verbose_name="آخرین قرائت")
    last_reading_at = models.DateTimeField(null=True, blank=True)
    
    installation_date = models.DateField(null=True, blank=True)
    calibration_due_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "سنسور"
        verbose_name_plural = "سنسورها"
        ordering = ['sensor_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_sensor_type_display()})"


class SensorReading(models.Model):
    """قرائت‌های سنسورها (داده‌های سری زمانی)"""
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        related_name='readings'
    )
    value = models.FloatField(verbose_name="مقدار")
    unit = models.CharField(max_length=20, blank=True)
    
    # وضعیت قرائت
    status = models.CharField(
        max_length=10,
        choices=[
            ('normal', 'نرمال'),
            ('warning', 'هشدار'),
            ('critical', 'بحرانی'),
        ],
        default='normal'
    )
    
    # متادیتا
    raw_data = models.JSONField(default=dict, blank=True, verbose_name="داده خام")
    recorded_at = models.DateTimeField(db_index=True, verbose_name="زمان ثبت")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "قرائت سنسور"
        verbose_name_plural = "قرائت‌های سنسور"
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['sensor', 'recorded_at']),
            models.Index(fields=['sensor', 'status']),
        ]
    
    def __str__(self):
        return f"{self.sensor.name}: {self.value} {self.unit}"


class Hotspot(models.Model):
    """نقاط حساس روی تصویر/نقشه سه‌بعدی دارایی (نسخه جدید)"""
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='digital_hotspots'  # 🆕 تغییر از hotspots به digital_hotspots
    )
    label = models.CharField(max_length=200, verbose_name="برچسب")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    
    # لینک به قطعه (اختیاری)
    part = models.ForeignKey(
        AssetPart,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='digital_hotspots'  # 🆕 تغییر
    )
    
    # لینک به سنسور (اختیاری)
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hotspots'  # 🆕
    )
    
    # موقعیت روی تصویر (درصد)
    x_position = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="موقعیت افقی (٪ عرض تصویر)"
    )
    y_position = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="موقعیت عمودی (٪ ارتفاع تصویر)"
    )
    
    # استایل
    icon = models.CharField(max_length=50, default='FaCircle')
    color = models.CharField(max_length=20, default='#EF4444')
    size = models.PositiveIntegerField(default=24, help_text="اندازه نقطه (px)")
    
    # نمایش داده زنده سنسور
    show_live_data = models.BooleanField(default=False, verbose_name="نمایش داده زنده")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "نقطه حساس"
        verbose_name_plural = "نقاط حساس"
        ordering = ['label']
    
    def __str__(self):
        return f"{self.label} - {self.asset.name}"


class MaintenanceSchedule(models.Model):
    """برنامه نگهداری پیشگیرانه"""
    FREQUENCY_CHOICES = [
        ('daily', 'روزانه'),
        ('weekly', 'هفتگی'),
        ('monthly', 'ماهانه'),
        ('quarterly', 'سه ماهه'),
        ('biannual', 'شش ماهه'),
        ('annual', 'سالانه'),
        ('runtime', 'بر اساس ساعت کارکرد'),
        ('condition', 'بر اساس شرایط (CBM)'),
    ]
    
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='maintenance_schedules'
    )
    title = models.CharField(max_length=300, verbose_name="عنوان")
    description = models.TextField(blank=True)
    
    # زمان‌بندی
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    runtime_hours_interval = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="برای نگهداری بر اساس ساعت کارکرد"
    )
    
    # وضعیت
    is_active = models.BooleanField(default=True)
    last_performed_at = models.DateTimeField(null=True, blank=True)
    next_due_at = models.DateTimeField(null=True, blank=True)
    
    # چک‌لیست
    checklist = models.JSONField(
        default=list,
        blank=True,
        verbose_name="چک‌لیست",
        help_text="لیست کارهایی که باید انجام شود"
    )
    
    # مسئول
    assigned_to = models.CharField(max_length=200, blank=True, verbose_name="مسئول")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "برنامه نگهداری"
        verbose_name_plural = "برنامه‌های نگهداری"
        ordering = ['next_due_at']
    
    def __str__(self):
        return f"{self.title} - {self.asset.name}"
    
    def calculate_next_due(self):
        """محاسبه تاریخ بعدی"""
        if not self.last_performed_at:
            return timezone.now()
        
        from datetime import timedelta
        intervals = {
            'daily': timedelta(days=1),
            'weekly': timedelta(weeks=1),
            'monthly': timedelta(days=30),
            'quarterly': timedelta(days=90),
            'biannual': timedelta(days=180),
            'annual': timedelta(days=365),
        }
        
        if self.frequency in intervals:
            return self.last_performed_at + intervals[self.frequency]
        return self.last_performed_at + timedelta(days=90)


class FailurePrediction(models.Model):
    """پیش‌بینی خرابی بر اساس داده‌های سنسور"""
    PREDICTION_STATUS = [
        ('active', 'فعال'),
        ('resolved', 'رفع شده'),
        ('false_positive', 'هشدار اشتباه'),
        ('expired', 'منقضی شده'),
    ]
    
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='failure_predictions'
    )
    part = models.ForeignKey(
        AssetPart,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='failure_predictions'
    )
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    
    # پیش‌بینی
    predicted_failure_date = models.DateTimeField(verbose_name="تاریخ تخمینی خرابی")
    confidence = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="درصد اطمینان",
        help_text="۰ تا ۱۰۰"
    )
    
    # تحلیل
    root_cause = models.TextField(blank=True, verbose_name="علت ریشه‌ای")
    recommended_action = models.TextField(blank=True, verbose_name="اقدام پیشنهادی")
    
    # وضعیت
    status = models.CharField(max_length=15, choices=PREDICTION_STATUS, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='failure_predictions',
        verbose_name='سنسور مرتبط'
    )
    
    class Meta:
        verbose_name = "پیش‌بینی خرابی"
        verbose_name_plural = "پیش‌بینی‌های خرابی"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - اطمینان {self.confidence}%"