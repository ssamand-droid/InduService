from django.contrib import admin
from .models import PlatformSetting


@admin.register(PlatformSetting)
class PlatformSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'title', 'setting_type', 'is_active')
    list_filter = ('setting_type', 'is_active')
    search_fields = ('key', 'title', 'description')