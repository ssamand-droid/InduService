"""apps/system_setting/admin.py"""
from django.contrib import admin
from django.utils.html import format_html
from .models import SystemSetting


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display  = ["key", "value_preview", "type_badge", "is_public", "updated_at"]
    list_filter   = ["setting_type", "is_public"]
    search_fields = ["key", "title", "value"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering      = ["setting_type", "key"]
    actions       = ["make_public", "make_private"]

    TYPE_COLORS = {
        "general":      "#6c757d",
        "commission":   "#f39c12",
        "payment":      "#3498db",
        "seo":          "#9b59b6",
        "notification": "#27ae60",
    }

    def value_preview(self, obj):
        val = obj.value
        if len(val) > 50:
            val = val[:50] + "..."
        return format_html('<code style="font-size:12px">{}</code>', val)
    value_preview.short_description = "مقدار"

    def type_badge(self, obj):
        color = self.TYPE_COLORS.get(obj.setting_type, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_setting_type_display()
        )
    type_badge.short_description = "نوع"

    def make_public(self, request, queryset):
        queryset.update(is_public=True)
    make_public.short_description = "عمومی کردن تنظیمات"

    def make_private(self, request, queryset):
        queryset.update(is_public=False)
    make_private.short_description = "خصوصی کردن تنظیمات"

    fieldsets = (
        ("اطلاعات اصلی", {"fields": ("key", "value", "title")}),
        ("طبقه‌بندی",   {"fields": ("setting_type", "is_public")}),
        ("متاداده",     {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)}),
    )
