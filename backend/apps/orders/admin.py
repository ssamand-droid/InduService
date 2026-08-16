# apps/orders/admin.py

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Order, OrderItem, MROWorkflowStep
from core.utils import to_jalali_date, format_price_rial


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total_price',)


class MROStepInline(admin.TabularInline):
    model = MROWorkflowStep
    extra = 0
    fields = ('step_type', 'title', 'status', 'order_index', 'assigned_to', 'started_at', 'completed_at')
    readonly_fields = ('started_at', 'completed_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number',
        'buyer_phone',
        'seller_phone',
        'status',
        'payment_status',
        'total_rial',
        'payment_verified',
        'created_at_jalali',
    ]
    list_filter = ('status', 'payment_status', 'payment_verified', 'created_at')
    search_fields = ('order_number', 'buyer__phone_number', 'seller__phone_number')
    raw_id_fields = ('buyer', 'seller')
    readonly_fields = (
        'order_number', 'subtotal', 'total',
        'created_at', 'updated_at',
        'confirmed_at', 'shipped_at', 'delivered_at', 'completed_at',
    )
    inlines = [OrderItemInline, MROStepInline]
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('order_number', 'buyer', 'seller', 'status', 'payment_status')
        }),
        ('پرداخت', {
            'fields': ('payment_verified', 'payment_receipt'),
        }),
        ('مبالغ', {
            'fields': ('subtotal', 'shipping_cost', 'tax', 'discount', 'total')
        }),
        ('اطلاعات ارسال', {
            'fields': ('shipping_address', 'shipping_city', 'shipping_postal_code', 'receiver_name', 'receiver_phone')
        }),
        ('یادداشت‌ها', {
            'fields': ('buyer_note', 'seller_note', 'admin_note')
        }),
        ('تاریخ‌های مهم', {
            'fields': ('created_at', 'updated_at', 'confirmed_at', 'shipped_at', 'delivered_at', 'completed_at')
        }),
    )

    def buyer_phone(self, obj):
        return obj.buyer.phone_number
    buyer_phone.short_description = 'خریدار'
    buyer_phone.admin_order_field = 'buyer__phone_number'

    def seller_phone(self, obj):
        return obj.seller.phone_number
    seller_phone.short_description = 'فروشنده'
    seller_phone.admin_order_field = 'seller__phone_number'

    def total_rial(self, obj):
        return format_price_rial(obj.total)
    total_rial.short_description = 'مبلغ کل (ریال)'
    total_rial.admin_order_field = 'total'

    def created_at_jalali(self, obj):
        return to_jalali_date(obj.created_at)
    created_at_jalali.short_description = 'تاریخ ایجاد'
    created_at_jalali.admin_order_field = 'created_at'

    actions = ['mark_payment_verified', 'mark_order_cancelled', 'mark_order_completed']

    @admin.action(description=_('تایید پرداخت'))
    def mark_payment_verified(self, request, queryset):
        updated = queryset.update(payment_verified=True, payment_status='paid')
        self.message_user(request, f'{updated} سفارش تایید پرداخت شدند.')

    @admin.action(description=_('لغو سفارش'))
    def mark_order_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} سفارش لغو شدند.')

    @admin.action(description=_('تکمیل سفارش'))
    def mark_order_completed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='completed', completed_at=timezone.now())
        self.message_user(request, f'{updated} سفارش تکمیل شدند.')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price', 'total_price')
    raw_id_fields = ('order', 'product')


@admin.register(MROWorkflowStep)
class MROWorkflowStepAdmin(admin.ModelAdmin):
    list_display = ('order', 'step_type', 'title', 'status', 'order_index', 'assigned_to')
    list_filter = ('step_type', 'status')
    search_fields = ('title', 'description', 'order__order_number')
    raw_id_fields = ('order', 'assigned_to')