from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Profile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # ========================
    # لیست نمایش
    # ========================
    list_display = ('phone_number', 'full_name', 'role_display_with_type', 'is_verified', 'is_active', 'date_joined')
    list_display_links = ('phone_number', 'full_name')
    list_filter = ('role', 'person_type', 'is_verified', 'is_active')
    search_fields = ('phone_number', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    # ========================
    # فرم‌های ویرایش
    # ========================
    fieldsets = (
        (None, {'fields': ('phone_number', 'email', 'password')}),
        (_('اطلاعات شخصی'), {'fields': ('first_name', 'last_name')}),
        (_('نوع شخصیت و سمت'), {'fields': ('person_type', 'subrole')}),
        (_('نقش و دسترسی‌ها'), {
            'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('تاریخ‌های مهم'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # ========================
    # فرم ایجاد کاربر جدید
    # ========================
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'person_type', 'subrole'),
        }),
    )
    
    # ========================
    # تنظیمات
    # ========================
    readonly_fields = ('date_joined', 'last_login')
    filter_horizontal = ('groups', 'user_permissions',)

    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = _('نام کامل')
    full_name.admin_order_field = 'first_name'

    def role_display_with_type(self, obj):
        """نمایش ترکیبی: نقش + نوع شخصیت + سمت"""
        role_label = obj.get_role_display()
        person_label = dict(User.PersonType.choices).get(obj.person_type, '')
        subrole_label = dict(User.SubRole.choices).get(obj.subrole, '')
        
        parts = [role_label]
        if person_label:
            parts.append(f"({person_label})")
        if subrole_label:
            parts.append(f"- {subrole_label}")
        
        return ' '.join(parts)
    role_display_with_type.short_description = 'نقش و سمت'


# ========================
# پروفایل (بدون تغییر)
# ========================
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_phone', 'company_name', 'city', 'rating', 'completed_orders')
    list_filter = ('city', 'user__role')
    search_fields = ('user__phone_number', 'user__email', 'company_name')
    raw_id_fields = ('user',)
    readonly_fields = ('rating', 'rating_count', 'completed_orders', 'total_revenue')

    def user_phone(self, obj):
        return obj.user.phone_number
    user_phone.short_description = _('شماره موبایل')
    user_phone.admin_order_field = 'user__phone_number'

    fieldsets = (
        (_('کاربر'), {'fields': ('user', 'avatar')}),
        (_('اطلاعات شخصی'), {'fields': ('bio', 'years_of_experience', 'specializations')}),
        (_('مدارک'), {'fields': ('certificate_title', 'certificate_file')}),
        (_('آمار'), {'fields': ('rating', 'rating_count', 'completed_orders', 'total_revenue', 'avg_response_time_hours')}),
        (_('شبکه‌های اجتماعی'), {'fields': ('website', 'linkedin', 'instagram')}),
        (_('اطلاعات شرکت'), {'fields': ('company_name', 'company_registration_number', 'tax_id')}),
        (_('آدرس'), {'fields': ('address', 'city', 'postal_code')}),
    )