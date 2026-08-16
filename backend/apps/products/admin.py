from django.contrib import admin
from .models import Category, Brand, TechnicalSpecification, Product, ProductImage, ProductDocument

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active', 'parent')
    search_fields = ('name',)
    verbose_name = 'دسته‌بندی محصول'
    verbose_name_plural = 'دسته‌بندی‌های محصولات'

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'country', 'is_active']
    prepopulated_fields = {'slug': ('name',)}

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

class ProductDocumentInline(admin.TabularInline):
    model = ProductDocument
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'seller', 'price', 'stock_quantity', 'is_active']
    list_filter = ['product_type', 'condition', 'is_active', 'category']
    search_fields = ['name', 'sku', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductDocumentInline]

admin.site.register(TechnicalSpecification)