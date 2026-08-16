from django.contrib import admin
from .models import Review, ReviewImage

class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 1

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'target_name', 'rating', 'is_verified_purchase', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_verified_purchase', 'is_approved', 'created_at')
    search_fields = ('title', 'comment', 'user__phone_number', 'user__email')
    raw_id_fields = ('user', 'product', 'service', 'service_request', 'order')
    inlines = [ReviewImageInline]
    actions = ['approve_reviews', 'unapprove_reviews']
    readonly_fields = ('created_at', 'updated_at')

    def target_name(self, obj):
        if obj.product:
            return f'📦 {obj.product.name}'
        if obj.service:
            return f'🔧 {obj.service.title}'
        if obj.service_request:
            return f'📝 {obj.service_request.title}'
        return '---'
    target_name.short_description = 'هدف نظر'

    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
    approve_reviews.short_description = 'تایید نظرات انتخاب شده'

    def unapprove_reviews(self, request, queryset):
        queryset.update(is_approved=False)
    unapprove_reviews.short_description = 'عدم تایید نظرات'


@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'review', 'image')
    raw_id_fields = ('review',)