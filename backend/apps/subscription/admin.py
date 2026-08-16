from django.contrib import admin
from .models import Plan, Subscription

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'price_monthly', 'max_assets', 'is_active', 'sort_order']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'plan']
    search_fields = ['user__phone_number', 'user__first_name']