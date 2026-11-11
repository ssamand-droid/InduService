# apps/payment/serializers.py

from rest_framework import serializers
from .models import (
    Invoice, Transaction, CommissionRule, Wallet, WalletTransaction,
    Settlement, Payment, PaymentReceipt
)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class CreatePaymentSerializer(serializers.Serializer):
    invoice_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=[('online', 'پرداخت آنلاین'), ('card', 'کارت به کارت')])
    return_url = serializers.URLField(required=False)


class CommissionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionRule
        fields = '__all__'


class WalletSerializer(serializers.ModelSerializer):
    available_balance = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'user', 'user_name', 'balance', 'frozen_balance', 'available_balance']
        read_only_fields = ['balance', 'frozen_balance']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'
        read_only_fields = ['created_at']


class PaymentReceiptSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentReceipt
        fields = ['id', 'image', 'image_url', 'note', 'created_at']
        read_only_fields = ['created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class PaymentSerializer(serializers.ModelSerializer):
    receipt = PaymentReceiptSerializer(read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_number', 'payment_type', 'payment_type_display',
            'amount', 'method', 'status', 'status_display', 'reference_id',
            'paid_at', 'verified_at', 'verified_by', 'rejection_reason',
            'receipt', 'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'verified_at', 'verified_by', 'rejection_reason', 'created_at', 'updated_at']


class InvoiceSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    commission_rule = serializers.SerializerMethodField()
    transactions = TransactionSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'platform_commission_amount', 'created_at', 'updated_at']

    def get_commission_rule(self, obj):
        return f'{obj.platform_commission_rate}%' if obj.platform_commission_rate else None


class SettlementSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Settlement
        fields = [
            'id', 'user', 'user_name', 'wallet', 'amount', 'status', 'status_display',
            'bank_name', 'bank_account_number', 'bank_card_number',
            'bank_shaba', 'bank_account_holder',
            'admin_note', 'approved_at', 'paid_at', 'created_at',
        ]
        read_only_fields = ['user', 'wallet', 'status', 'approved_at', 'paid_at', 'created_at']
        extra_kwargs = {
            'bank_name': {'required': False},
            'bank_account_number': {'required': False},
            'bank_card_number': {'required': False},
            'bank_shaba': {'required': False},
            'bank_account_holder': {'required': False},
        }