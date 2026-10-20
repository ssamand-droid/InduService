from rest_framework import serializers
from django.utils.text import slugify
from .models import ServiceCategory, Service, ServiceRequest, ServiceImage, ServiceRequestAttachment, ServiceCompletionImage, ServiceRequestQuote
from users.serializers import UserSerializer

# ============================================================
# ServiceCategory
# ============================================================
class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'is_active']
        read_only_fields = ['slug']


# ============================================================
# ServiceImage
# ============================================================
class ServiceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ['id', 'image', 'alt_text']


# ============================================================
# ServiceRequestAttachment - باید قبل از ServiceRequestSerializer بیاد
# ============================================================
class ServiceRequestAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequestAttachment
        fields = ['id', 'file', 'file_url', 'is_image', 'description', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None

    def get_is_image(self, obj):
        if obj.file:
            ext = obj.file.name.lower().split('.')[-1]
            return ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        return False


# ============================================================
# ServiceCompletionImage - باید قبل از ServiceRequestSerializer بیاد
# ============================================================
class ServiceCompletionImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceCompletionImage
        fields = ['id', 'image', 'image_url', 'description', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


# ============================================================
# ServiceRequestQuoteSerializer (برای نمایش پیشنهادات قیمت)
# ============================================================
class ServiceRequestQuoteSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.full_name', read_only=True)
    provider_phone = serializers.CharField(source='provider.phone_number', read_only=True)

    class Meta:
        model = ServiceRequestQuote
        fields = ['id', 'provider', 'provider_name', 'provider_phone', 'quoted_price',
                  'provider_notes', 'estimated_completion_date', 'advance_payment_required',
                  'advance_payment_amount', 'is_selected', 'created_at']
        read_only_fields = ['id', 'provider', 'created_at', 'is_selected']


# ============================================================
# ServiceList
# ============================================================
class ServiceListSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    service_scenario_display = serializers.CharField(source='get_service_scenario_display', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'title', 'slug', 'service_type', 'service_scenario',
            'service_scenario_display', 'pricing_model', 'base_price',
            'hourly_rate', 'provider_name', 'category_name', 'service_area',
            'estimated_duration_days', 'warranty_months', 'is_remote', 'is_onsite',
            'primary_image', 'is_active', 'is_featured', 'created_at'
        ]

    def get_provider_name(self, obj):
        """
        نام فروشنده را فقط وقتی نشان بده که buyer درخواست accepted داشته باشد.
        در غیر این صورت، مهمان و کاربران دیگر نام را نبینند.
        """
        request = self.context.get('request')

        # مهمان (لاگین نکرده) - نام را نبیند
        if not request or not request.user.is_authenticated:
            return "🔒 تایید شده"

        # ادمین - ببیند
        if request.user.role == 'admin' or request.user.is_staff:
            return obj.provider.full_name

        # buyer - فقط اگر درخواست accepted/in_progress/completed داشته باشد
        if request.user.role in ['buyer', 'technician', 'maintenance_manager', 'procurement']:
            from .models import ServiceRequest
            has_accepted = ServiceRequest.objects.filter(
                service=obj,
                buyer=request.user,
                status__in=['accepted', 'in_progress', 'completed']
            ).exists()
            if has_accepted:
                return obj.provider.full_name
            return "🔒 پس از پذیرش درخواست نمایش داده می‌شود"

        # seller/provider دیگر - نام را نبیند
        return "🔒 فروشنده"

    def get_primary_image(self, obj):
        """دریافت اولین تصویر خدمت"""
        try:
            first_image = obj.images.first()
            if first_image and first_image.image:
                request = self.context.get('request')
                if request:
                    # اگر تصویر با http شروع نشده بود، absolute URL بساز
                    url = first_image.image.url
                    if url.startswith('/'):
                        return request.build_absolute_uri(url)
                    return url
                return first_image.image.url
        except Exception as e:
            print(f"Error getting primary image: {e}")
        return None


# ============================================================
# ServiceDetail
# ============================================================
class ServiceDetailSerializer(serializers.ModelSerializer):
    provider = UserSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    images = ServiceImageSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = '__all__'


# ============================================================
# ServiceCreateUpdate
# ============================================================
class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            'category', 'title', 'service_type', 'service_scenario', 'pricing_model',
            'base_price', 'hourly_rate', 'description', 'requirements',
            'estimated_duration_days', 'warranty_months', 'service_area',
            'is_remote', 'is_onsite', 'is_active'
        ]

    def create(self, validated_data):
        validated_data['provider'] = self.context['request'].user
        validated_data['slug'] = slugify(validated_data['title'], allow_unicode=True)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ============================================================
# ServiceRequestSerializer (نسخه نهایی با اضافه شدن quotes)
# ============================================================
class ServiceRequestSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    buyer_phone = serializers.CharField(source='buyer.phone_number', read_only=True)

    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        required=False,
        allow_null=True
    )
    service_title = serializers.CharField(source='service.title', read_only=True)
    provider_name = serializers.CharField(source='service.provider.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    related_asset_name = serializers.CharField(source='related_asset.name', read_only=True)
    attachments = ServiceRequestAttachmentSerializer(many=True, read_only=True)
    completion_images = ServiceCompletionImageSerializer(many=True, read_only=True)
    remaining_amount = serializers.SerializerMethodField(read_only=True)
    selected_provider_id = serializers.SerializerMethodField(read_only=True)

    # 🔥 اضافه کردن فیلد quotes برای نمایش لیست پیشنهادات قیمت
    quotes = ServiceRequestQuoteSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'buyer', 'buyer_name', 'buyer_phone', 'selected_provider_id',
            'service', 'service_title', 'provider_name',
            'title', 'description', 'equipment_details',
            'desired_start_date', 'urgency',
            'status', 'status_display',
            'provider_notes', 'quoted_price', 'final_price',
            'advance_payment_required', 'advance_payment_amount', 'advance_payment_paid',
            'estimated_completion_date', 'actual_completion_date',
            'force_majeure_declared', 'force_majeure_reason',
            'completion_notes', 'completion_images',
            'buyer_rating', 'buyer_review', 'reviewed_at',
            'attachments', 'extra_data', 'related_asset', 'related_asset_name',
            'order', 'remaining_amount', 'created_at', 'updated_at',
            'quotes',  # ← اضافه شد
        ]
        read_only_fields = [
            'buyer', 'status', 'provider_notes', 'quoted_price', 'final_price',
            'advance_payment_required', 'advance_payment_amount', 'advance_payment_paid',
            'estimated_completion_date', 'actual_completion_date', 'force_majeure_declared',
            'force_majeure_reason', 'completion_notes', 'buyer_rating', 'buyer_review',
            'reviewed_at', 'order', 'created_at', 'updated_at',
        ]

    def get_selected_provider_id(self, obj):
        selected_quote = obj.quotes.filter(is_selected=True).select_related('provider').first()
        if selected_quote:
            return selected_quote.provider_id
        if obj.service_id:
            return obj.service.provider_id
        return None

    def get_remaining_amount(self, obj):
        if hasattr(obj, 'invoice'):
            return float(obj.invoice.remaining_amount)
        return None


# ============================================================
# ServiceRequestUpdate
# ============================================================
class ServiceRequestUpdateSerializer(serializers.ModelSerializer):
    """فیلدهای قابل ویرایش خریدار، فقط پیش از شروع بررسی"""
    class Meta:
        model = ServiceRequest
        fields = ['title', 'description', 'equipment_details', 'desired_start_date', 'urgency', 'extra_data']


# ============================================================
# ProviderQuote
# ============================================================
class ProviderQuoteSerializer(serializers.Serializer):
    """سریالایزر اعلام قیمت توسط ارائه‌دهنده"""
    quoted_price = serializers.DecimalField(max_digits=14, decimal_places=0, required=True)
    provider_notes = serializers.CharField(required=False, allow_blank=True)
    estimated_completion_date = serializers.DateField(required=False)
    advance_payment_required = serializers.BooleanField(default=False)
    advance_payment_amount = serializers.DecimalField(max_digits=14, decimal_places=0, required=False, allow_null=True)

    def validate(self, attrs):
        if attrs.get('advance_payment_required') and not attrs.get('advance_payment_amount'):
            raise serializers.ValidationError({
                "advance_payment_amount": "در صورت نیاز به پیش‌پرداخت، مبلغ را وارد کنید."
            })
        return attrs


# ============================================================
# ForceMajeure
# ============================================================
class ForceMajeureSerializer(serializers.Serializer):
    """سریالایزر فورس ماژور"""
    reason = serializers.CharField(required=True)


# ============================================================
# Review
# ============================================================
class ReviewSerializer(serializers.Serializer):
    """سریالایزر نظر و امتیاز"""
    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    review = serializers.CharField(required=False, allow_blank=True)