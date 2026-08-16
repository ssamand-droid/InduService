from django.contrib import admin
from .models import (
    AssetCategory, Asset, AssetPart, AssetDocument,
    AssetHealthLog, AssetMaintenanceLog, AssetAlert,
    DigitalTwinHotspot, AssetImportBatch, MaintenanceImportBatch
)


@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'default_maintenance_interval_days']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


class AssetPartInline(admin.TabularInline):
    model = AssetPart
    extra = 0
    fields = ['name', 'part_number', 'stock_quantity', 'criticality']


class AssetDocumentInline(admin.TabularInline):
    model = AssetDocument
    extra = 0


class AssetHealthLogInline(admin.TabularInline):
    model = AssetHealthLog
    extra = 0
    readonly_fields = ['recorded_at']


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['name', 'tag_number', 'category', 'status', 'health_index', 'owner', 'created_at']
    list_filter = ['status', 'criticality', 'category']
    search_fields = ['name', 'tag_number', 'brand', 'model_number', 'location']
    readonly_fields = ['health_index', 'created_at', 'updated_at']
    inlines = [AssetPartInline, AssetDocumentInline, AssetHealthLogInline]
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('owner', 'category', 'name', 'tag_number')
        }),
        ('مشخصات فنی', {
            'fields': ('brand', 'model_number', 'serial_number', 'manufacturer', 'year_of_manufacture')
        }),
        ('موقعیت و وضعیت', {
            'fields': ('location', 'production_line', 'status', 'criticality')
        }),
        ('شاخص سلامت', {
            'fields': ('health_index',)
        }),
        ('هزینه‌ها', {
            'fields': ('purchase_price', 'hourly_downtime_cost')
        }),
        ('زمان‌بندی', {
            'fields': ('installation_date', 'last_maintenance_date', 'next_maintenance_date')
        }),
        ('تصاویر', {
            'fields': ('main_image', 'nameplate_image')
        }),
        ('سایر', {
            'fields': ('notes', 'is_active', 'created_at', 'updated_at')
        }),
    )


@admin.register(AssetPart)
class AssetPartAdmin(admin.ModelAdmin):
    list_display = ['name', 'part_number', 'asset', 'stock_quantity', 'criticality']
    list_filter = ['criticality']
    search_fields = ['name', 'part_number']


@admin.register(AssetMaintenanceLog)
class AssetMaintenanceLogAdmin(admin.ModelAdmin):
    list_display = ['title', 'asset', 'maintenance_type', 'started_at', 'downtime_hours']
    list_filter = ['maintenance_type']


@admin.register(AssetAlert)
class AssetAlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'asset', 'severity', 'alert_type', 'is_read', 'created_at']
    list_filter = ['severity', 'alert_type', 'is_read']


@admin.register(AssetImportBatch)
class AssetImportBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'success_count', 'error_count', 'created_at']
    list_filter = ['status']


admin.site.register(DigitalTwinHotspot)
admin.site.register(MaintenanceImportBatch)