from rest_framework import serializers
from django.utils.text import slugify
from .models import (
    Category, Brand, TechnicalSpecification, Product,
    ProductSpecificationValue, ProductImage, ProductDocument
)
from users.serializers import UserSerializer

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'parent', 'children', 'is_active']
        read_only_fields = ['slug']

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []

    def create(self, validated_data):
        validated_data['slug'] = slugify(validated_data['name'], allow_unicode=True)
        return super().create(validated_data)

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'website', 'country', 'is_active']
        read_only_fields = ['slug']

    def create(self, validated_data):
        validated_data['slug'] = slugify(validated_data['name'], allow_unicode=True)
        return super().create(validated_data)

class TechnicalSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalSpecification
        fields = ['id', 'name', 'unit', 'description']

class ProductSpecificationValueSerializer(serializers.ModelSerializer):
    specification = TechnicalSpecificationSerializer(read_only=True)
    specification_id = serializers.PrimaryKeyRelatedField(
        queryset=TechnicalSpecification.objects.all(),
        source='specification',
        write_only=True
    )

    class Meta:
        model = ProductSpecificationValue
        fields = ['id', 'specification', 'specification_id', 'value']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']

class ProductDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDocument
        fields = ['id', 'title', 'file', 'file_type']

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    seller = serializers.PrimaryKeyRelatedField(read_only=True)
    primary_image = serializers.SerializerMethodField()
    final_price = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'product_type', 'condition',
            'category_name', 'brand_name', 'seller_name', 'seller',
            'short_description', 'final_price', 'price', 'discount_price',
            'stock_quantity', 'is_in_stock', 'lead_time_days',
            'primary_image', 'is_active', 'is_featured', 'created_at'
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return self.context['request'].build_absolute_uri(primary.image.url)
        first_image = obj.images.first()
        if first_image:
            return self.context['request'].build_absolute_uri(first_image.image.url)
        return None

class ProductDetailSerializer(serializers.ModelSerializer):
    """سریالایزر کامل برای صفحه جزئیات محصول"""
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    documents = ProductDocumentSerializer(many=True, read_only=True)
    specs = ProductSpecificationValueSerializer(source='productspecificationvalue_set', many=True, read_only=True)
    final_price = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'category', 'brand', 'name', 'slug', 'sku',
            'product_type', 'condition', 'description', 'short_description',
            'price', 'discount_price', 'final_price', 'stock_quantity',
            'min_order_quantity', 'is_in_stock', 'lead_time_days',
            'images', 'documents', 'specs', 'is_active', 'is_featured',
            'meta_title', 'meta_description', 'average_rating',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['seller', 'slug', 'created_at', 'updated_at']

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """سریالایزر ایجاد و ویرایش محصول"""
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'category', 'brand', 'name', 'sku', 'product_type', 'condition',
            'description', 'short_description', 'price', 'discount_price',
            'stock_quantity', 'min_order_quantity', 'lead_time_days',
            'is_active', 'is_featured',
            'meta_title', 'meta_description', 'meta_keywords',
        ]

    def validate_sku(self, value):
        """چک کند sku تکراری نباشد"""
        instance = getattr(self, 'instance', None)
        qs = Product.objects.filter(sku=value)
        if instance:
            qs = qs.exclude(id=instance.id)
        if qs.exists():
            raise serializers.ValidationError("این کد انبار قبلاً ثبت شده است")
        return value

    def create(self, validated_data):
        specs_data = validated_data.pop('productspecificationvalue_set', [])
        images_data = validated_data.pop('images', [])
        validated_data['seller'] = self.context['request'].user
        validated_data['slug'] = slugify(validated_data['name'], allow_unicode=True)

        product = Product.objects.create(**validated_data)

        # ایجاد مشخصات فنی
        for spec_data in specs_data:
            ProductSpecificationValue.objects.create(product=product, **spec_data)

        # ایجاد تصاویر
        for img_data in images_data:
            ProductImage.objects.create(product=product, **img_data)

        return product

    def update(self, instance, validated_data):
        specs_data = validated_data.pop('productspecificationvalue_set', None)
        images_data = validated_data.pop('images', None)

        # بروزرسانی فیلدهای اصلی
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # بروزرسانی مشخصات فنی (حذف قبلی‌ها و ایجاد جدید)
        if specs_data is not None:
            instance.productspecificationvalue_set.all().delete()
            for spec_data in specs_data:
                ProductSpecificationValue.objects.create(product=instance, **spec_data)

        # تصاویر جدید اضافه می‌شوند (حذف تصاویر از طریق endpoint جداگانه)
        if images_data is not None:
            for img_data in images_data:
                ProductImage.objects.create(product=instance, **img_data)

        return instance
    
class ProductUpdateSerializer(serializers.ModelSerializer):
    """سریالایزر مخصوص ویرایش - بدون تغییر slug و seller"""
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'category', 'brand', 'name', 'sku', 'product_type', 'condition',
            'description', 'short_description', 'price', 'discount_price',
            'stock_quantity', 'min_order_quantity', 'lead_time_days',
            'is_active', 'is_featured',
            'meta_title', 'meta_description',
        ]

    def validate_sku(self, value):
        # چک کند sku تکراری نباشد (به جز خودش)
        if self.instance and Product.objects.filter(sku=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("این کد انبار قبلاً ثبت شده است")
        return value    