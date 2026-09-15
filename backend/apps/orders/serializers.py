# apps/orders/serializers.py - کامل

from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem, MROWorkflowStep
from products.serializers import ProductListSerializer
from core.utils import to_jalali_datetime, format_price_rial

class OrderItemSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_details', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['unit_price', 'total_price']


class MROStepSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(read_only=True)  # 🆕
    assigned_to = serializers.PrimaryKeyRelatedField(read_only=True)  # 🆕
    started_at = serializers.DateTimeField(read_only=True)  # 🆕
    completed_at = serializers.DateTimeField(read_only=True)  # 🆕

    class Meta:
        model = MROWorkflowStep
        fields = '__all__'
        read_only_fields = ['order', 'assigned_to', 'started_at', 'completed_at']  # 🆕


class OrderListSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    buyer_phone = serializers.CharField(source='buyer.phone_number', read_only=True)
    seller_phone = serializers.CharField(source='seller.phone_number', read_only=True)
    items_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    created_at_jalali = serializers.SerializerMethodField()
    total_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number',
            'buyer', 'buyer_name', 'buyer_phone',
            'seller', 'seller_name', 'seller_phone',
            'status', 'status_display',
            'payment_status', 'payment_status_display',
            'payment_verified',
            'total', 'subtotal', 'shipping_cost',
            'items_count',
            'shipping_address', 'shipping_city',
            'receiver_name', 'receiver_phone',
            'created_at', 'confirmed_at', 'shipped_at', 'delivered_at', 'completed_at',
            'created_at_jalali', 'total_formatted',
        ]

    def get_items_count(self, obj):
        return obj.items.count()

    def get_buyer_name(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        # فروشنده فقط buyer_name را ببیند، seller دیگر را نه
        if user and user.role in ['seller', 'service_provider']:
            if obj.seller == user:
                return obj.buyer.full_name
            return "🔒 خریدار"
        return obj.buyer.full_name

    def get_seller_name(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        # buyer فقط seller_name را ببیند
        if user and user.role == 'buyer':
            if obj.buyer == user:
                return obj.seller.full_name
            return "🔒 فروشنده"
        return obj.seller.full_name

    def get_created_at_jalali(self, obj):
        return to_jalali_datetime(obj.created_at)

    def get_total_formatted(self, obj):
        return format_price_rial(obj.total)


class OrderDetailSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    mro_steps = MROStepSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'buyer', 'seller', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'seller', 'shipping_address', 'shipping_city', 'shipping_postal_code',
            'receiver_name', 'receiver_phone', 'buyer_note', 'items'
        ]

    def validate(self, attrs):
        if not attrs.get('items'):
            raise serializers.ValidationError("حداقل یک آیتم باید وجود داشته باشد.")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['buyer'] = self.context['request'].user
        validated_data['status'] = Order.OrderStatus.PENDING

        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        order.calculate_totals()
        return order