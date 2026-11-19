from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import RFQ, SupplierQuote, PurchaseOrder, PurchaseOrderLine, GoodsReceipt, Shipment, SupplierInvoice, ProcurementPayment
from .serializers import RFQSerializer, SupplierQuoteSerializer, PurchaseOrderSerializer, GoodsReceiptSerializer, ShipmentSerializer, SupplierInvoiceSerializer, ProcurementPaymentSerializer, LedgerAccountSerializer, LedgerJournalSerializer
from payment.models import LedgerAccount, LedgerJournal
from payment.ledger import post_procurement_payment

def member_orgs(user):
    return user.organization_memberships.filter(is_active=True).values_list('organization_id', flat=True)

class TenantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    def ensure_member(self, org_id):
        if not self.request.user.is_staff and not self.request.user.organization_memberships.filter(organization_id=org_id, is_active=True).exists():
            raise PermissionDenied()

class RFQViewSet(TenantViewSet):
    serializer_class = RFQSerializer
    def get_queryset(self):
        return RFQ.objects.filter(buyer_id__in=member_orgs(self.request.user)) if not self.request.user.is_staff else RFQ.objects.all()
    def perform_create(self, serializer):
        self.ensure_member(serializer.validated_data['buyer'].id)
        serializer.save(created_by=self.request.user)
    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        rfq = self.get_object()
        self.ensure_member(rfq.buyer_id)
        if rfq.status != RFQ.Status.DRAFT or not rfq.lines.exists():
            raise ValidationError('فقط RFQ پیش‌نویس دارای ردیف قابل انتشار است.')
        rfq.status = RFQ.Status.OPEN
        rfq.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(rfq).data)
    @action(detail=True, methods=['post'])
    def award(self, request, pk=None):
        rfq = self.get_object()
        self.ensure_member(rfq.buyer_id)
        try:
            quote = rfq.quotes.get(pk=request.data.get('quote'))
        except SupplierQuote.DoesNotExist:
            raise ValidationError({'quote': 'پیشنهاد متعلق به RFQ نیست.'})
        if rfq.status != RFQ.Status.OPEN or quote.status != SupplierQuote.Status.SUBMITTED:
            raise ValidationError('RFQ یا پیشنهاد در وضعیت انتخاب نیست.')
        with transaction.atomic():
            quote.status = SupplierQuote.Status.ACCEPTED
            quote.save(update_fields=['status', 'updated_at'])
            rfq.status = RFQ.Status.AWARDED
            rfq.save(update_fields=['status', 'updated_at'])
            po = PurchaseOrder.objects.create(rfq=rfq, quote=quote, buyer=rfq.buyer,
                supplier=quote.supplier, currency=quote.currency, created_by=request.user)
            for ql in quote.lines.select_related('rfq_line'):
                PurchaseOrderLine.objects.create(purchase_order=po, quote_line=ql,
                    description=ql.rfq_line.description, quantity=ql.quantity, unit_price=ql.unit_price)
            rfq.quotes.exclude(pk=quote.pk).filter(status=SupplierQuote.Status.SUBMITTED).update(status=SupplierQuote.Status.REJECTED)
        return Response(PurchaseOrderSerializer(po).data, status=201)

class SupplierQuoteViewSet(TenantViewSet):
    serializer_class = SupplierQuoteSerializer
    def get_queryset(self):
        orgs = member_orgs(self.request.user)
        qs = SupplierQuote.objects.select_related('rfq', 'supplier').prefetch_related('lines')
        return qs if self.request.user.is_staff else qs.filter(Q(supplier_id__in=orgs) | Q(rfq__buyer_id__in=orgs))
    def perform_create(self, serializer):
        supplier = serializer.validated_data['supplier']
        self.ensure_member(supplier.id)
        if supplier.organization_type != 'supplier':
            raise ValidationError({'supplier': 'سازمان باید از نوع تأمین‌کننده باشد.'})
        serializer.save(submitted_by=self.request.user)

class PurchaseOrderViewSet(TenantViewSet):
    serializer_class = PurchaseOrderSerializer
    def get_queryset(self):
        qs = PurchaseOrder.objects.prefetch_related('lines', 'receipts')
        return qs if self.request.user.is_staff else qs.filter(Q(buyer_id__in=member_orgs(self.request.user)) | Q(supplier_id__in=member_orgs(self.request.user)))
    def create(self, request, *args, **kwargs):
        raise PermissionDenied('سفارش خرید فقط از انتخاب پیشنهاد RFQ صادر می‌شود.')
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        po = self.get_object()
        self.ensure_member(po.supplier_id)
        if po.status != PurchaseOrder.Status.ISSUED:
            raise ValidationError('سفارش خرید در وضعیت صادرشده نیست.')
        po.status = PurchaseOrder.Status.ACKNOWLEDGED
        po.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(po).data)

class GoodsReceiptViewSet(TenantViewSet):
    serializer_class = GoodsReceiptSerializer
    def get_queryset(self):
        qs = GoodsReceipt.objects.select_related('purchase_order').prefetch_related('lines')
        return qs if self.request.user.is_staff else qs.filter(purchase_order__buyer_id__in=member_orgs(self.request.user))
    def perform_create(self, serializer):
        po = serializer.validated_data['purchase_order']
        self.ensure_member(po.buyer_id)
        if po.status not in (PurchaseOrder.Status.ACKNOWLEDGED, PurchaseOrder.Status.PARTIALLY_RECEIVED):
            raise ValidationError({'purchase_order': 'سفارش خرید هنوز توسط تأمین‌کننده تأیید نشده است.'})
        receipt = serializer.save(received_by=self.request.user)
        total_ordered = {str(line.pk): line.quantity for line in po.lines.all()}
        for line in po.lines.all():
            already = sum((r.quantity_accepted for r in line.receipt_lines.filter(receipt__status=GoodsReceipt.Status.ACCEPTED)), 0)
            submitted = sum((r.quantity_accepted for r in receipt.lines.filter(purchase_order_line=line)), 0)
            if already + submitted > line.quantity:
                receipt.delete()
                raise ValidationError({'lines': f'دریافت بیش از مقدار سفارش برای {line.description} است.'})
        receipt.status = GoodsReceipt.Status.ACCEPTED
        receipt.save(update_fields=['status', 'updated_at'])
        complete = all(sum((r.quantity_accepted for r in line.receipt_lines.filter(receipt__status=GoodsReceipt.Status.ACCEPTED)), 0) >= line.quantity for line in po.lines.all())
        po.status = PurchaseOrder.Status.RECEIVED if complete else PurchaseOrder.Status.PARTIALLY_RECEIVED
        po.save(update_fields=['status', 'updated_at'])

class ShipmentViewSet(TenantViewSet):
    serializer_class = ShipmentSerializer
    def get_queryset(self):
        qs = Shipment.objects.select_related('purchase_order')
        return qs if self.request.user.is_staff else qs.filter(purchase_order__buyer_id__in=member_orgs(self.request.user)) | qs.filter(purchase_order__supplier_id__in=member_orgs(self.request.user))
    def perform_create(self, serializer):
        po = serializer.validated_data['purchase_order']
        self.ensure_member(po.supplier_id)
        serializer.save(created_by=self.request.user)

class SupplierInvoiceViewSet(TenantViewSet):
    serializer_class = SupplierInvoiceSerializer
    def get_queryset(self):
        qs = SupplierInvoice.objects.select_related('purchase_order')
        return qs if self.request.user.is_staff else qs.filter(purchase_order__buyer_id__in=member_orgs(self.request.user)) | qs.filter(purchase_order__supplier_id__in=member_orgs(self.request.user))
    def perform_create(self, serializer):
        po = serializer.validated_data['purchase_order']
        self.ensure_member(po.supplier_id)
        serializer.save(submitted_by=self.request.user)
    @action(detail=True, methods=['post'])
    def match(self, request, pk=None):
        invoice = self.get_object()
        self.ensure_member(invoice.purchase_order.buyer_id)
        if invoice.status != SupplierInvoice.Status.SUBMITTED:
            raise ValidationError('فاکتور در وضعیت ثبت‌شده نیست.')
        invoice.status = SupplierInvoice.Status.MATCHED
        invoice.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(invoice).data)

class ProcurementPaymentViewSet(TenantViewSet):
    serializer_class = ProcurementPaymentSerializer
    def get_queryset(self):
        qs = ProcurementPayment.objects.select_related('invoice__purchase_order')
        return qs if self.request.user.is_staff else qs.filter(
            Q(invoice__purchase_order__buyer_id__in=member_orgs(self.request.user)) |
            Q(invoice__purchase_order__supplier_id__in=member_orgs(self.request.user))
        )
    @transaction.atomic
    def perform_create(self, serializer):
        invoice = SupplierInvoice.objects.select_for_update().get(pk=serializer.validated_data['invoice'].pk)
        self.ensure_member(invoice.purchase_order.buyer_id)
        if invoice.status not in (SupplierInvoice.Status.MATCHED, SupplierInvoice.Status.SETTLED):
            raise ValidationError({'invoice': 'ابتدا فاکتور باید تطبیق شود.'})
        if serializer.validated_data.get('amount', 0) <= 0:
            raise ValidationError({'amount': 'مبلغ پرداخت باید بیشتر از صفر باشد.'})
        if invoice.currency != invoice.purchase_order.currency:
            raise ValidationError({'invoice': 'ارز فاکتور باید با سفارش خرید یکسان باشد.'})
        payment = serializer.save(recorded_by=self.request.user)
        paid = sum((p.amount for p in invoice.payments.exclude(status=ProcurementPayment.Status.REVERSED)), 0)
        if paid > invoice.amount:
            payment.delete()
            raise ValidationError({'amount': 'جمع پرداخت از مبلغ فاکتور بیشتر می‌شود.'})
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    @transaction.atomic
    def verify(self, request, pk=None):
        payment = self.get_object()
        if payment.status != ProcurementPayment.Status.RECORDED:
            raise ValidationError({'detail': 'فقط پرداخت ثبت‌شده قابل تأیید است.'})
        invoice = SupplierInvoice.objects.select_for_update().get(pk=payment.invoice_id)
        payment.status = ProcurementPayment.Status.VERIFIED
        payment.save(update_fields=['status', 'updated_at'])
        try:
            post_procurement_payment(payment)
        except ValueError as exc:
            raise ValidationError({'detail': str(exc)})
        verified_total = sum((p.amount for p in invoice.payments.filter(status=ProcurementPayment.Status.VERIFIED)), 0)
        if verified_total >= invoice.amount:
            invoice.status = SupplierInvoice.Status.SETTLED
            invoice.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(payment).data)

class LedgerAccountViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LedgerAccountSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        qs = LedgerAccount.objects.select_related('organization').prefetch_related('entries')
        if self.request.user.is_staff:
            return qs
        return qs.filter(organization__memberships__user=self.request.user, organization__memberships__is_active=True).distinct()

class LedgerJournalViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LedgerJournalSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        qs = LedgerJournal.objects.select_related('organization').prefetch_related('entries__account')
        if self.request.user.is_staff:
            return qs
        return qs.filter(organization__memberships__user=self.request.user, organization__memberships__is_active=True).distinct()
