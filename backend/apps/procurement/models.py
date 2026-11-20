import uuid
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel


class RFQ(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('پیش‌نویس')
        OPEN = 'open', _('باز برای پیشنهاد')
        AWARDED = 'awarded', _('واگذارشده')
        CANCELLED = 'cancelled', _('لغوشده')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT, related_name='rfqs')
    work_order = models.ForeignKey('work_orders.WorkOrder', on_delete=models.PROTECT, null=True, blank=True, related_name='rfqs')
    reference = models.CharField(max_length=30, unique=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    currency = models.CharField(max_length=3, default='IRR')
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    due_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_rfqs')

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f'RFQ-{uuid.uuid4().hex[:10].upper()}'
        super().save(*args, **kwargs)


class RFQLine(TimeStampedModel):
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name='lines')
    description = models.CharField(max_length=250)
    specification = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=14, decimal_places=3, validators=[MinValueValidator(Decimal('0.001'))])
    unit = models.CharField(max_length=30, default='عدد')
    required_by = models.DateField(null=True, blank=True)


class SupplierQuote(TimeStampedModel):
    class Status(models.TextChoices):
        SUBMITTED = 'submitted', _('ارسال‌شده')
        ACCEPTED = 'accepted', _('پذیرفته‌شده')
        REJECTED = 'rejected', _('ردشده')
        WITHDRAWN = 'withdrawn', _('پس‌گرفته‌شده')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq = models.ForeignKey(RFQ, on_delete=models.PROTECT, related_name='quotes')
    supplier = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT, related_name='supplier_quotes')
    reference = models.CharField(max_length=60, blank=True)
    currency = models.CharField(max_length=3, default='IRR')
    valid_until = models.DateField(null=True, blank=True)
    lead_time_days = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.SUBMITTED)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='submitted_supplier_quotes')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['rfq', 'supplier', 'reference'], name='uniq_rfq_supplier_quote_ref')]


class SupplierQuoteLine(TimeStampedModel):
    quote = models.ForeignKey(SupplierQuote, on_delete=models.CASCADE, related_name='lines')
    rfq_line = models.ForeignKey(RFQLine, on_delete=models.PROTECT, related_name='supplier_prices')
    unit_price = models.DecimalField(max_digits=18, decimal_places=2, validators=[MinValueValidator(0)])
    quantity = models.DecimalField(max_digits=14, decimal_places=3, validators=[MinValueValidator(Decimal('0.001'))])
    notes = models.TextField(blank=True)


class PurchaseOrder(TimeStampedModel):
    class Status(models.TextChoices):
        ISSUED = 'issued', _('صادرشده')
        ACKNOWLEDGED = 'acknowledged', _('تأیید تأمین‌کننده')
        PARTIALLY_RECEIVED = 'partially_received', _('دریافت جزئی')
        RECEIVED = 'received', _('دریافت کامل')
        CANCELLED = 'cancelled', _('لغوشده')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq = models.ForeignKey(RFQ, on_delete=models.PROTECT, related_name='purchase_orders')
    quote = models.ForeignKey(SupplierQuote, on_delete=models.PROTECT, related_name='purchase_orders')
    buyer = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT, related_name='purchase_orders')
    supplier = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT, related_name='sales_purchase_orders')
    number = models.CharField(max_length=36, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ISSUED)
    currency = models.CharField(max_length=3, default='IRR')
    issued_at = models.DateTimeField(default=timezone.now)
    expected_at = models.DateField(null=True, blank=True)
    terms = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_purchase_orders')

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = f'PO-{uuid.uuid4().hex[:12].upper()}'
        super().save(*args, **kwargs)


class PurchaseOrderLine(TimeStampedModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='lines')
    quote_line = models.ForeignKey(SupplierQuoteLine, on_delete=models.PROTECT, related_name='purchase_order_lines')
    description = models.CharField(max_length=250)
    quantity = models.DecimalField(max_digits=14, decimal_places=3, validators=[MinValueValidator(Decimal('0.001'))])
    unit_price = models.DecimalField(max_digits=18, decimal_places=2, validators=[MinValueValidator(0)])


class GoodsReceipt(TimeStampedModel):
    class Status(models.TextChoices):
        RECEIVED = 'received', _('ثبت اولیه')
        ACCEPTED = 'accepted', _('تأییدشده')
        REJECTED = 'rejected', _('ردشده')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name='receipts')
    reference = models.CharField(max_length=60, blank=True)
    received_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.RECEIVED)
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='goods_receipts')


class GoodsReceiptLine(TimeStampedModel):
    receipt = models.ForeignKey(GoodsReceipt, on_delete=models.CASCADE, related_name='lines')
    purchase_order_line = models.ForeignKey(PurchaseOrderLine, on_delete=models.PROTECT, related_name='receipt_lines')
    quantity_accepted = models.DecimalField(max_digits=14, decimal_places=3, default=0, validators=[MinValueValidator(0)])
    quantity_rejected = models.DecimalField(max_digits=14, decimal_places=3, default=0, validators=[MinValueValidator(0)])
    rejection_reason = models.TextField(blank=True)


class Shipment(TimeStampedModel):
    class Status(models.TextChoices):
        PREPARING = 'preparing', _('در حال آماده‌سازی')
        DISPATCHED = 'dispatched', _('ارسال‌شده')
        IN_TRANSIT = 'in_transit', _('در مسیر')
        DELIVERED = 'delivered', _('تحویل‌شده')
        EXCEPTION = 'exception', _('دارای مشکل')

    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name='shipments')
    reference = models.CharField(max_length=80)
    carrier = models.CharField(max_length=120, blank=True)
    tracking_number = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PREPARING)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_shipments')


class SupplierInvoice(TimeStampedModel):
    class Status(models.TextChoices):
        SUBMITTED = 'submitted', _('ثبت‌شده')
        MATCHED = 'matched', _('تطبیق‌شده')
        DISPUTED = 'disputed', _('مورد اختلاف')
        SETTLED = 'settled', _('تسویه‌شده')

    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name='supplier_invoices')
    invoice_number = models.CharField(max_length=80)
    amount = models.DecimalField(max_digits=18, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='IRR')
    due_at = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.SUBMITTED)
    document = models.FileField(upload_to='procurement/invoices/', blank=True)
    notes = models.TextField(blank=True)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='submitted_procurement_invoices')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['purchase_order', 'invoice_number'], name='uniq_po_invoice_number')]


class ProcurementPayment(TimeStampedModel):
    class Status(models.TextChoices):
        RECORDED = 'recorded', _('ثبت‌شده')
        VERIFIED = 'verified', _('تأییدشده')
        REVERSED = 'reversed', _('برگشت‌خورده')

    invoice = models.ForeignKey(SupplierInvoice, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=18, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    paid_at = models.DateTimeField(default=timezone.now)
    reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.RECORDED)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='procurement_payments')
