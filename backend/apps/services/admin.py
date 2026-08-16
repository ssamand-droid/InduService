from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.contrib import messages
from django.utils.html import format_html
from .models import ServiceCategory, Service, ServiceRequest, ServiceImage


class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 1
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        """پیش‌نمایش تصویر در ادمین"""
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover; border-radius: 8px;" />',
                obj.image.url
            )
        return "بدون تصویر"
    image_preview.short_description = 'پیش‌نمایش'


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'icon_preview')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active',)
    search_fields = ('name',)
    
    def icon_preview(self, obj):
        """پیش‌نمایش آیکون دسته‌بندی"""
        if obj.icon:
            return format_html('<img src="{}" width="40" height="40" style="object-fit: cover; border-radius: 4px;" />', obj.icon.url)
        return "—"
    icon_preview.short_description = 'آیکون'


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'provider', 'category', 'service_type', 
        'pricing_model', 'base_price', 'is_active', 'image_count', 'first_image_preview'
    )
    list_filter = ('service_type', 'pricing_model', 'is_active', 'is_remote', 'is_onsite')
    search_fields = ('title', 'description', 'provider__phone_number', 'provider__first_name')
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ('provider', 'category')
    inlines = [ServiceImageInline]
    readonly_fields = ('created_at', 'updated_at', 'image_count', 'first_image_preview')
    
    fieldsets = (
        (_('اطلاعات اصلی'), {
            'fields': ('provider', 'category', 'title', 'slug', 'description')
        }),
        (_('جزئیات خدمت'), {
            'fields': ('service_type', 'service_scenario', 'pricing_model', 'base_price', 'hourly_rate')
        }),
        (_('زمان و گارانتی'), {
            'fields': ('estimated_duration_days', 'warranty_months')
        }),
        (_('محدوده و نوع انجام'), {
            'fields': ('service_area', 'is_remote', 'is_onsite')
        }),
        (_('وضعیت'), {
            'fields': ('is_active', 'is_featured', 'requirements')
        }),
        (_('تاریخ‌ها'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_count(self, obj):
        """تعداد تصاویر خدمت"""
        count = obj.images.count()
        if count > 0:
            return format_html('<span style="color: #2563eb; font-weight: bold;">📷 {}</span>', count)
        return format_html('<span style="color: #9ca3af;">📷 0</span>')
    image_count.short_description = 'تعداد تصاویر'
    
    def first_image_preview(self, obj):
        """نمایش اولین تصویر در لیست"""
        first_image = obj.images.first()
        if first_image and first_image.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 8px;" />',
                first_image.image.url
            )
        return format_html(
            '<div style="width:50px; height:50px; background:#f3f4f6; border-radius:8px; display:flex; align-items:center; justify-content:center;">🔧</div>'
        )
    first_image_preview.short_description = 'تصویر'


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'buyer', 'buyer_company', 'service_provider', 
        'status', 'urgency', 'has_attachment', 'created_at'
    )
    list_filter = ('status', 'urgency', 'created_at')
    search_fields = ('title', 'description', 'buyer__phone_number', 'buyer__first_name')
    raw_id_fields = ('buyer', 'service', 'order', 'related_asset')
    readonly_fields = ('created_at', 'updated_at', 'attachments_preview')
    
    fieldsets = (
        (_('اطلاعات درخواست'), {
            'fields': ('title', 'description', 'equipment_details', 'urgency', 'desired_start_date')
        }),
        (_('طرفین'), {
            'fields': ('buyer', 'service', 'related_asset')
        }),
        (_('وضعیت و مالی'), {
            'fields': ('status', 'quoted_price', 'final_price', 'advance_payment_required', 'advance_payment_amount')
        }),
        (_('فایل‌های پیوست'), {
            'fields': ('attachments_preview',),
            'classes': ('collapse',)
        }),
        (_('سایر'), {
            'fields': ('extra_data', 'order', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def buyer_company(self, obj):
        profile = getattr(obj.buyer, 'profile', None)
        if profile and profile.company_name:
            return profile.company_name
        return '—'
    buyer_company.short_description = 'شرکت خریدار'
    
    def service_provider(self, obj):
        if obj.service and obj.service.provider:
            return obj.service.provider.full_name
        if obj.service:
            return obj.service.provider.phone_number
        return '—'
    service_provider.short_description = 'ارائه‌دهنده'
    
    def has_attachment(self, obj):
        """آیا فایل پیوست دارد"""
        count = obj.attachments.count()
        if count > 0:
            return format_html('✅ {} فایل', count)
        return '❌'
    has_attachment.short_description = 'پیوست'
    
    def attachments_preview(self, obj):
        """نمایش فایل‌های پیوست شده"""
        attachments = obj.attachments.all()
        if not attachments:
            return 'هیچ فایلی پیوست نشده است'
        
        html = '<div style="direction:rtl;">'
        for att in attachments:
            if att.file:
                # بررسی اگر تصویر است
                if att.file.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                    html += f'''
                    <div style="display:inline-block; margin:5px;">
                        <a href="{att.file.url}" target="_blank">
                            <img src="{att.file.url}" width="80" height="80" style="object-fit:cover; border-radius:8px; border:1px solid #e2e8f0;" />
                        </a>
                        <br><small>{att.description if att.description else "بدون توضیح"}</small>
                    </div>
                    '''
                else:
                    html += f'''
                    <div style="margin:5px 0;">
                        <a href="{att.file.url}" target="_blank" style="color:#2563eb;">
                            📄 {att.file.name.split("/")[-1]}
                        </a>
                        <br><small>{att.description if att.description else "بدون توضیح"}</small>
                    </div>
                    '''
        html += '</div>'
        return format_html(html)
    attachments_preview.short_description = 'پیش‌نمایش پیوست‌ها'


@admin.register(ServiceImage)
class ServiceImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'service', 'image_preview', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('service__title', 'alt_text')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover; border-radius: 8px;" />',
                obj.image.url
            )
        return "بدون تصویر"
    image_preview.short_description = 'تصویر'