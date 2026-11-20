from django.contrib import admin
from .models import WorkOrder, WorkTask, WorkLog, WorkEvidence

class TaskInline(admin.TabularInline):
    model = WorkTask
    extra = 0

@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'service_request', 'customer', 'provider', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('service_request__title', 'customer__phone_number', 'provider__phone_number')
    inlines = (TaskInline,)

admin.site.register((WorkLog, WorkEvidence))
