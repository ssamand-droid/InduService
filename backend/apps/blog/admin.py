from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import BlogPost, BlogCategory, BlogTag

@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'status', 'view_count', 'published_at', 'is_featured')
    list_filter = ('status', 'category', 'is_featured', 'published_at', 'created_at')
    search_fields = ('title', 'excerpt', 'content', 'meta_keywords')
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ('author',)
    filter_horizontal = ('tags',)
    date_hierarchy = 'published_at'

    fieldsets = (
        (_('اطلاعات اصلی'), {
            'fields': ('title', 'slug', 'author', 'category', 'tags', 'status', 'is_featured')
        }),
        (_('محتوا'), {
            'fields': ('excerpt', 'content', 'featured_image', 'read_time')
        }),
        (_('SEO و متا'), {
            'fields': ('meta_title', 'meta_description', 'meta_keywords', 'canonical_url', 'og_image', 'noindex'),
            'classes': ('collapse',)
        }),
        (_('تاریخ‌ها'), {
            'fields': ('published_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')

    actions = ['make_published', 'make_draft', 'make_featured', 'unmake_featured']

    def make_published(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='published', published_at=timezone.now())
        self.message_user(request, f'{queryset.count()} مقاله منتشر شد.')
    make_published.short_description = _('انتشار مقالات انتخاب شده')

    def make_draft(self, request, queryset):
        queryset.update(status='draft')
        self.message_user(request, f'{queryset.count()} مقاله به پیش‌نویس تغییر یافت.')
    make_draft.short_description = _('پیش‌نویس کردن مقالات انتخاب شده')

    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f'{queryset.count()} مقاله ویژه شد.')
    make_featured.short_description = _('ویژه کردن')

    def unmake_featured(self, request, queryset):
        queryset.update(is_featured=False)
        self.message_user(request, f'{queryset.count()} مقاله از ویژه خارج شد.')
    unmake_featured.short_description = _('حذف از ویژه')