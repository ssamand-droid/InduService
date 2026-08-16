from django.contrib import admin
from .models import Notification, NotificationTemplate

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'type', 'title', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__email')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'subject', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('code', 'name', 'subject')