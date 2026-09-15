from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.contrib import messages
from .models import ServiceCategory, Service, ServiceRequest, ServiceImage


class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 1


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active',)
    search_fields = ('name',)
    verbose_name = 'دسته‌بندی خدمات'
    verbose_name_plural = 'دسته‌بندی‌های خدمات'


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'provider', 'category', 'service_type', 'pricing_model', 'base_price', 'is_active')
    list_filter = ('service_type', 'pricing_model', 'is_active', 'is_remote', 'is_onsite')
    search_fields = ('title', 'description', 'provider__email')
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ('provider',)
    inlines = [ServiceImageInline]


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'buyer', 'buyer_company', 'service_provider',
        'status', 'urgency', 'matching_enabled', 'match_count', 'created_at'
    )
    list_filter = ('status', 'urgency', 'created_at')
    list_editable = ['matching_enabled']
    search_fields = ('title', 'description', 'buyer__phone_number', 'buyer__first_name')
    raw_id_fields = ('buyer', 'service', 'order', 'related_asset')
    readonly_fields = ('created_at', 'updated_at', 'match_providers_display', 'matching_enabled')

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
        # (_('🎯 Matching Engine'), {
        #     'fields': ('matching_enabled', 'match_providers_display'),
        #     'description': 'کنترل فعال/غیرفعال بودن Matching Engine برای این درخواست'
        # }),
        (_('سایر'), {
            'fields': ('extra_data', 'order', 'created_at', 'updated_at')
        }),
    )

    actions = ['enable_matching', 'disable_matching', 'run_matching_now']

    # ========================
    # فیلدهای نمایشی
    # ========================

    def buyer_company(self, obj):
        profile = getattr(obj.buyer, 'profile', None)
        if profile and profile.company_name:
            return profile.company_name
        return '—'
    buyer_company.short_description = 'شرکت خریدار'

    def service_provider(self, obj):
        if obj.service and obj.service.provider:
            return obj.service.provider.full_name
        return '—'
    service_provider.short_description = 'ارائه‌دهنده'

    def matching_enabled(self, obj):
        """نمایش وضعیت Matching Engine"""
        is_enabled = obj.extra_data.get('matching_enabled', True)
        if is_enabled:
            return '✅ فعال'
        return '❌ غیرفعال'
    matching_enabled.short_description = 'Matching Engine'

    def match_count(self, obj):
        """تعداد پیمانکاران پیدا شده"""
        matched = obj.extra_data.get('matched_providers', [])
        return len(matched) if matched else 0
    match_count.short_description = 'تعداد تطابق'

    def match_providers_display(self, obj):
        """نمایش پیمانکاران تطابق یافته"""
        matched = obj.extra_data.get('matched_providers', [])
        if not matched:
            return 'هنوز تطابقی انجام نشده'

        html = '<div style="direction:rtl; margin-top:10px;">'
        for i, p in enumerate(matched[:3], 1):
            html += f"""
            <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:8px; border:1px solid #e2e8f0;">
                <strong>#{i}</strong> {p['name']}<br>
                ⭐ {p['rating']} | 📍 {p['city']} | 🎯 {p['score']}%<br>
                <small style="color:#64748b;">تخصص: {p['specializations']}</small>
            </div>
            """
        html += '</div>'
        return html
    match_providers_display.short_description = 'پیمانکاران پیشنهادی'

    # ========================
    # Actions
    # ========================

    def enable_matching(self, request, queryset):
        """فعال‌سازی Matching Engine برای درخواست‌های انتخاب شده"""
        count = 0
        for req in queryset:
            req.extra_data['matching_enabled'] = True
            req.save(update_fields=['extra_data'])
            count += 1
        messages.success(request, f'✅ Matching Engine برای {count} درخواست فعال شد.')
    enable_matching.short_description = '✅ فعال‌سازی Matching Engine'

    def disable_matching(self, request, queryset):
        """غیرفعال‌سازی Matching Engine برای درخواست‌های انتخاب شده"""
        count = 0
        for req in queryset:
            req.extra_data['matching_enabled'] = False
            req.save(update_fields=['extra_data'])
            count += 1
        messages.warning(request, f'❌ Matching Engine برای {count} درخواست غیرفعال شد.')
    disable_matching.short_description = '❌ غیرفعال‌سازی Matching Engine'

    def run_matching_now(self, request, queryset):
        """اجرای دستی Matching Engine برای درخواست‌های انتخاب شده"""
        from .matching_engine import MatchingEngine

        total_matches = 0
        for req in queryset:
            results = MatchingEngine.find_best_providers(req)
            req.extra_data['matched_providers'] = results
            req.extra_data['matching_enabled'] = True
            req.save(update_fields=['extra_data'])
            total_matches += len(results)

        messages.success(
            request,
            f'🎯 Matching Engine اجرا شد: {total_matches} پیمانکار برای {queryset.count()} درخواست پیدا شد.'
        )
    run_matching_now.short_description = '🔄 اجرای Matching Engine'


# ========================
# تنظیمات سراسری Matching Engine (مدل ساده)
# ========================
class MatchingEngineSettings(admin.ModelAdmin):
    """
    تنظیمات سراسری Matching Engine
    این یک مدل ساده در admin هست که تنظیمات رو در cache یا settings ذخیره می‌کنه
    می‌تونید بعداً یک مدل واقعی براش بسازید
    """
    pass


# ثبت تنظیمات در admin (اختیاری - می‌تونید یک مدل Config واقعی بسازید)
# admin.site.register(MatchingEngineSettings)