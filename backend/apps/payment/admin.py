# apps/payment/admin.py

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Invoice, Transaction, CommissionRule, Wallet, WalletTransaction


class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0
    readonly_fields = ('created_at', 'updated_at', 'payment_data')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'buyer', 'seller', 'status', 'total', 'platform_commission_amount', 'issued_at', 'paid_at')
    list_filter = ('status', 'issued_at')
    search_fields = ('invoice_number', 'buyer__phone_number', 'seller__phone_number')
    raw_id_fields = ('buyer', 'seller', 'order', 'service_request')
    readonly_fields = ('invoice_number', 'platform_commission_amount', 'remaining_amount', 'payment_verified', 'payment_receipt', 'created_at', 'updated_at')
    inlines = [TransactionInline]
    fieldsets = (
        (_('اطلاعات پایه'), {
            'fields': ('invoice_number', 'buyer', 'seller', 'order', 'service_request', 'status')
        }),
        (_('مبالغ'), {
            'fields': ('subtotal', 'total', 'advance_payment', 'remaining_amount')
        }),
        (_('کمیسیون'), {
            'fields': ('platform_commission_rate', 'platform_commission_amount')
        }),
        (_('پرداخت'), {
            'fields': ('payment_verified', 'payment_receipt', 'paid_at')
        }),
        (_('تاریخ‌ها'), {
            'fields': ('created_at', 'issued_at', 'due_date')
        }),
    )


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice', 'user', 'amount', 'transaction_type', 'status', 'paid_at')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('gateway_tracking_code', 'reference_number', 'user__phone_number')
    raw_id_fields = ('invoice', 'user')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CommissionRule)
class CommissionRuleAdmin(admin.ModelAdmin):
    list_display = ('rule_type', 'service_scenario', 'commission_rate', 'advance_payment_rate', 'min_commission', 'max_commission', 'is_active')
    list_filter = ('rule_type', 'is_active')
    list_editable = ('commission_rate', 'advance_payment_rate', 'is_active')
    search_fields = ('service_scenario',)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'frozen_balance', 'available_balance', 'created_at')
    search_fields = ('user__phone_number', 'user__email')
    raw_id_fields = ('user',)
    readonly_fields = ('balance', 'frozen_balance')


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'amount', 'transaction_type', 'description', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('wallet__user__phone_number', 'description', 'reference_id')
    raw_id_fields = ('wallet',)
    readonly_fields = ('created_at',)