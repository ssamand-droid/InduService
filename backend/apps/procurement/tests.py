from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.test import TestCase
from rest_framework.test import APIClient

from organizations.models import Organization
from payment.models import LedgerEntry, LedgerJournal
from procurement.models import RFQ, RFQLine, SupplierQuote, SupplierQuoteLine, PurchaseOrder, SupplierInvoice, ProcurementPayment


class ProcurementLedgerTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_superuser(phone_number='09123330001', password='test-pass-123')
        self.buyer_org = Organization.objects.create(name='خریدار', organization_type=Organization.Type.FACTORY, created_by=self.admin)
        self.supplier_org = Organization.objects.create(name='تأمین‌کننده', organization_type=Organization.Type.SUPPLIER, created_by=self.admin)
        self.rfq = RFQ.objects.create(buyer=self.buyer_org, title='یاتاقان', created_by=self.admin, status=RFQ.Status.OPEN)
        self.rfq_line = RFQLine.objects.create(rfq=self.rfq, description='یاتاقان 6205', quantity=2)
        self.quote = SupplierQuote.objects.create(rfq=self.rfq, supplier=self.supplier_org, submitted_by=self.admin, currency='IRR')
        self.quote_line = SupplierQuoteLine.objects.create(quote=self.quote, rfq_line=self.rfq_line, quantity=2, unit_price=50000)
        self.purchase_order = PurchaseOrder.objects.create(
            rfq=self.rfq, quote=self.quote, buyer=self.buyer_org, supplier=self.supplier_org,
            currency='IRR', created_by=self.admin,
        )
        self.invoice = SupplierInvoice.objects.create(
            purchase_order=self.purchase_order, invoice_number='SUP-1', amount=Decimal('100000'),
            currency='IRR', status=SupplierInvoice.Status.MATCHED, submitted_by=self.admin,
        )
        self.payment = ProcurementPayment.objects.create(
            invoice=self.invoice, amount=Decimal('100000'), reference='BANK-123', recorded_by=self.admin,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_admin_verification_posts_balanced_party_journals_once(self):
        response = self.client.post(f'/api/procurement/payments/{self.payment.pk}/verify/')
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.invoice.refresh_from_db()
        self.assertEqual(self.payment.status, ProcurementPayment.Status.VERIFIED)
        self.assertEqual(self.invoice.status, SupplierInvoice.Status.SETTLED)
        self.assertEqual(LedgerJournal.objects.count(), 2)
        self.assertEqual(LedgerEntry.objects.count(), 4)
        for journal in LedgerJournal.objects.all():
            totals = journal.entries.aggregate(debits=Sum('debit'), credits=Sum('credit'))
            self.assertEqual(totals['debits'], totals['credits'])
        retry = self.client.post(f'/api/procurement/payments/{self.payment.pk}/verify/')
        self.assertEqual(retry.status_code, 400)
        self.assertEqual(LedgerJournal.objects.count(), 2)
        self.assertEqual(LedgerEntry.objects.count(), 4)
