from rest_framework import serializers
from .models import RFQ, RFQLine, SupplierQuote, SupplierQuoteLine, PurchaseOrder, PurchaseOrderLine, GoodsReceipt, GoodsReceiptLine, Shipment, SupplierInvoice, ProcurementPayment
from payment.models import LedgerAccount, LedgerEntry, LedgerJournal

class RFQLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQLine
        exclude = ('rfq',)

class RFQSerializer(serializers.ModelSerializer):
    lines = RFQLineSerializer(many=True)
    class Meta:
        model = RFQ
        fields = '__all__'
        read_only_fields = ('created_by', 'status', 'reference')
    def create(self, validated_data):
        lines = validated_data.pop('lines')
        obj = RFQ.objects.create(**validated_data)
        RFQLine.objects.bulk_create([RFQLine(rfq=obj, **line) for line in lines])
        return obj

class QuoteLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierQuoteLine
        exclude = ('quote',)

class SupplierQuoteSerializer(serializers.ModelSerializer):
    lines = QuoteLineSerializer(many=True)
    class Meta:
        model = SupplierQuote
        fields = '__all__'
        read_only_fields = ('submitted_by', 'status')
    def validate(self, attrs):
        rfq = attrs.get('rfq', getattr(self.instance, 'rfq', None))
        if rfq and rfq.status != RFQ.Status.OPEN:
            raise serializers.ValidationError({'rfq': 'درخواست قیمت باز نیست.'})
        return attrs
    def create(self, validated_data):
        lines = validated_data.pop('lines')
        obj = SupplierQuote.objects.create(**validated_data)
        for line in lines:
            if line['rfq_line'].rfq_id != obj.rfq_id:
                raise serializers.ValidationError({'lines': 'ردیف باید متعلق به همین RFQ باشد.'})
            SupplierQuoteLine.objects.create(quote=obj, **line)
        return obj

class POLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderLine
        fields = '__all__'
        read_only_fields = ('purchase_order',)

class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = POLineSerializer(many=True, read_only=True)
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ('created_by', 'number', 'status', 'buyer', 'supplier', 'currency')

class ReceiptLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsReceiptLine
        exclude = ('receipt',)

class GoodsReceiptSerializer(serializers.ModelSerializer):
    lines = ReceiptLineSerializer(many=True)
    class Meta:
        model = GoodsReceipt
        fields = '__all__'
        read_only_fields = ('received_by', 'status')
    def create(self, validated_data):
        lines = validated_data.pop('lines')
        obj = GoodsReceipt.objects.create(**validated_data)
        for line in lines:
            pol = line['purchase_order_line']
            if pol.purchase_order_id != obj.purchase_order_id:
                raise serializers.ValidationError({'lines': 'ردیف سفارش خرید نامعتبر است.'})
            GoodsReceiptLine.objects.create(receipt=obj, **line)
        return obj

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ('created_by',)

class SupplierInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierInvoice
        fields = '__all__'
        read_only_fields = ('submitted_by', 'status')

    def get_fields(self):
        fields = super().get_fields()
        if self.instance is not None:
            fields['purchase_order'].read_only = True
        return fields


class ProcurementPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcurementPayment
        fields = '__all__'
        read_only_fields = ('recorded_by', 'status')

    def get_fields(self):
        fields = super().get_fields()
        if self.instance is not None:
            fields['invoice'].read_only = True
        return fields

class LedgerAccountSerializer(serializers.ModelSerializer):
    balance = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    class Meta:
        model = LedgerAccount
        fields = ('id', 'organization', 'code', 'name', 'account_type', 'currency', 'balance')

class LedgerEntrySerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    class Meta:
        model = LedgerEntry
        fields = ('id', 'account', 'account_code', 'account_name', 'description', 'debit', 'credit')

class LedgerJournalSerializer(serializers.ModelSerializer):
    entries = LedgerEntrySerializer(many=True, read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    class Meta:
        model = LedgerJournal
        fields = ('id', 'organization', 'organization_name', 'source_key', 'memo', 'currency', 'posted_at', 'entries')
