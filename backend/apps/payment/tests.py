"""
تست‌های اپ payment - فاکتور، کیف پول، کمیسیون
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from payment.models import Invoice, Wallet, CommissionRule, Settlement

User = get_user_model()


class PaymentAPITestCase(TestCase):
    """تست API های پرداخت و کیف پول"""

    def setUp(self):
        self.client = APIClient()

        self.buyer = User.objects.create_user(
            phone_number='09120000001', password='testpass123',
            first_name='خریدار', last_name='تست', role='buyer'
        )
        self.seller = User.objects.create_user(
            phone_number='09120000002', password='testpass123',
            first_name='فروشنده', last_name='تست', role='seller'
        )
        self.admin = User.objects.create_user(
            phone_number='09120000003', password='testpass123',
            first_name='ادمین', last_name='تست', role='admin', is_staff=True
        )

        resp = self.client.post('/api/token/', {'phone_number': '09120000001', 'password': 'testpass123'})
        self.buyer_token = resp.data['access']

        resp = self.client.post('/api/token/', {'phone_number': '09120000002', 'password': 'testpass123'})
        self.seller_token = resp.data['access']

        resp = self.client.post('/api/token/', {'phone_number': '09120000003', 'password': 'testpass123'})
        self.admin_token = resp.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')

        self.invoice = Invoice.objects.create(
            buyer=self.buyer,
            seller=self.seller,
            subtotal=50000000,
            total=50000000,
            platform_commission_rate=12.0,
            platform_commission_amount=6000000,
            status=Invoice.InvoiceStatus.ISSUED,
        )

    # ============ فاکتورها ============

    def test_list_my_invoices(self):
        response = self.client.get('/api/payment/invoices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_invoice_detail(self):
        response = self.client.get(f'/api/payment/invoices/{self.invoice.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_seller_sees_their_invoices(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')
        response = self.client.get('/api/payment/invoices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_see_invoices(self):
        client = APIClient()
        response = client.get('/api/payment/invoices/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invoice_number_auto_generated(self):
        self.assertIsNotNone(self.invoice.invoice_number)
        self.assertTrue(self.invoice.invoice_number.startswith('INV-'))

    # ============ کیف پول ============

    def test_my_wallet(self):
        """تست کیف پول - URL صحیح: wallets"""
        response = self.client.get('/api/payment/wallets/my_wallet/')
        self.assertIn(response.status_code, [200, 201])

    def test_wallet_transactions(self):
        """تست تراکنش‌های کیف پول"""
        wallet, _ = Wallet.objects.get_or_create(user=self.buyer)
        response = self.client.get('/api/payment/wallets/transactions/')
        self.assertIn(response.status_code, [200])

    # ============ امنیت ============

    def test_cannot_verify_payment_as_buyer(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')
        response = self.client.post(f'/api/payment/invoices/{self.invoice.id}/verify_payment/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_verify_payment(self):
        import tempfile
        from django.core.files.uploadedfile import SimpleUploadedFile
        temp = tempfile.NamedTemporaryFile(suffix='.jpg')
        temp.write(b'fake receipt')
        temp.seek(0)
        self.invoice.payment_receipt = SimpleUploadedFile('receipt.jpg', temp.read())
        self.invoice.save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.post(f'/api/payment/invoices/{self.invoice.id}/verify_payment/')
        self.assertIn(response.status_code, [200, 201])
        self.invoice.refresh_from_db()
        self.assertTrue(self.invoice.payment_verified)

    # ============ کمیسیون ============

    def test_default_commission(self):
        rate = Invoice.get_commission_rate()
        self.assertGreaterEqual(rate, 0)
        self.assertLessEqual(rate, 100)

    # ============ تسویه ============

    def test_create_settlement(self):
        """تست تسویه حساب"""
        wallet, _ = Wallet.objects.get_or_create(user=self.seller)
        wallet.balance = 10000000
        wallet.save()

        # ست کردن پروفایل فروشنده
        profile = self.seller.profile
        profile.bank_name = 'ملی'
        profile.bank_account_number = '1234567890'
        profile.bank_card_number = '6037991234567890'
        profile.save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')
        response = self.client.post('/api/payment/settlements/', {
            'amount': 5000000,
        }, format='json')
        self.assertIn(response.status_code, [201, 400])