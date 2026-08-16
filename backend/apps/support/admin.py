"""apps/support/admin.py"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Ticket, TicketMessage, Dispute


class TicketMessageInline(admin.TabularInline):
    model       = TicketMessage
    extra       = 0
    readonly_fields = ["sender", "body", "attachment", "created_at"]
    can_delete  = False


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display   = ["short_id", "subject", "user_phone_display", "status_badge",
                      "priority_badge", "category", "messages_count", "created_at"]
    list_filter    = ["status", "priority", "category"]
    search_fields  = ["subject", "user__phone_number", "user__first_name", "user__last_name"]
    raw_id_fields  = ["user", "assigned_to", "order"]
    inlines        = [TicketMessageInline]
    readonly_fields = ["created_at", "updated_at"]
    actions        = ["mark_in_review", "mark_resolved", "mark_closed"]

    PRIORITY_COLORS = {
        "low": "#6c757d", "medium": "#f39c12",
        "high": "#e74c3c", "urgent": "#c0392b",
    }
    STATUS_COLORS = {
        "open": "#3498db", "in_review": "#f39c12",
        "resolved": "#27ae60", "closed": "#95a5a6",
    }

    def short_id(self, obj):
        return str(obj.id)[:8]
    short_id.short_description = "ID"

    def user_phone_display(self, obj):
        return obj.user_phone
    user_phone_display.short_description = "شماره کاربر"

    def status_badge(self, obj):
        color = self.STATUS_COLORS.get(obj.status, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "وضعیت"

    def priority_badge(self, obj):
        color = self.PRIORITY_COLORS.get(obj.priority, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = "اولویت"

    def mark_in_review(self, request, queryset):
        queryset.update(status="in_review")
    mark_in_review.short_description = "تغییر به: در بررسی"

    def mark_resolved(self, request, queryset):
        queryset.update(status="resolved")
    mark_resolved.short_description = "تغییر به: حل شده"

    def mark_closed(self, request, queryset):
        queryset.update(status="closed")
    mark_closed.short_description = "تغییر به: بسته"


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display  = ["id", "order", "raised_by", "resolution", "resolved_at", "created_at"]
    list_filter   = ["resolution"]
    search_fields = ["order__id", "raised_by__phone_number"]
    readonly_fields = ["created_at", "updated_at", "raised_by"]
    actions       = ["resolve_to_provider", "resolve_to_buyer"]

    def resolve_to_provider(self, request, queryset):
        from django.utils import timezone
        for dispute in queryset.filter(resolution="pending"):
            dispute.resolve("to_provider", "حل شده توسط ادمین")
    resolve_to_provider.short_description = "آزاد کردن وجه برای متخصص"

    def resolve_to_buyer(self, request, queryset):
        for dispute in queryset.filter(resolution="pending"):
            dispute.resolve("to_buyer", "بازگشت وجه به خریدار")
    resolve_to_buyer.short_description = "بازگشت وجه به خریدار"
