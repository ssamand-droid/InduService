"""
تست‌های اپ services - درخواست خدمت
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from services.models import (
    ServiceCategory, Service, ServiceRequest, ServiceRequestAttachment, ServiceRequestQuote
)

User = get_user_model()


class ServiceAPITestCase(TestCase):
    """تست API های درخواست خدمت"""

    def setUp(self):
        self.client = APIClient()

        # کاربر خریدار
        self.buyer = User.objects.create_user(
            phone_number='09120000001',
            password='testpass123',
            first_name='علی',
            last_name='خریدار',
            role='buyer'
        )

        # کاربر فروشنده/ارائه‌دهنده
        self.provider = User.objects.create_user(
            phone_number='09120000002',
            password='testpass123',
            first_name='رضا',
            last_name='ارائه‌دهنده',
            role='service_provider'
        )

        # لاگین خریدار
        response = self.client.post('/api/token/', {
            'phone_number': '09120000001',
            'password': 'testpass123'
        })
        self.buyer_token = response.data['access']

        # لاگین ارائه‌دهنده
        response = self.client.post('/api/token/', {
            'phone_number': '09120000002',
            'password': 'testpass123'
        })
        self.provider_token = response.data['access']

        # ست کردن توکن خریدار به‌عنوان پیش‌فرض
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')

        # ایجاد یک سرویس نمونه توسط ارائه‌دهنده
        self.category = ServiceCategory.objects.create(
            name='تعمیرات پمپ',
            slug='pump-repair'
        )
        self.service = Service.objects.create(
            provider=self.provider,
            category=self.category,
            title='تعمیر پمپ سانتریفیوژ',
            slug='pump-repair-service',
            service_type='repair',
            service_scenario='emergency_repair',
            pricing_model='quotation',
            description='تعمیر انواع پمپ',
        )

    # ============ ایجاد درخواست خدمت ============

    def test_create_service_request_minimal(self):
        """تست ایجاد درخواست خدمت با حداقل داده"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')

        response = self.client.post('/api/services/requests/', {
            'title': 'تعمیر پمپ CIP',
            'description': 'پمپ لرزش غیرعادی دارد',
            'urgency': 'high',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ServiceRequest.objects.count(), 1)

    def test_create_service_request_with_service(self):
        """تست ایجاد درخواست خدمت با انتخاب سرویس"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')

        response = self.client.post('/api/services/requests/', {
            'title': 'تعمیر پمپ',
            'description': 'لرزش پمپ',
            'urgency': 'medium',
            'service': self.service.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['service'], self.service.id)

    def test_create_request_missing_description(self):
        """تست ایجاد درخواست بدون شرح مشکل"""
        response = self.client.post('/api/services/requests/', {
            'title': 'تست',
            'urgency': 'low',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ============ لیست درخواست‌ها ============

    def test_list_my_requests(self):
        """تست لیست درخواست‌های خریدار"""
        # ایجاد یک درخواست
        ServiceRequest.objects.create(
            buyer=self.buyer,
            title='درخواست تست',
            description='توضیحات تست',
            urgency='medium',
        )

        response = self.client.get('/api/services/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get('results', response.data)), 1)

    def test_provider_sees_their_requests(self):
        """تست اینکه ارائه‌دهنده درخواست‌های خودش را ببیند"""
        # ایجاد درخواست برای سرویس ارائه‌دهنده
        ServiceRequest.objects.create(
            buyer=self.buyer,
            service=self.service,
            title='درخواست برای ارائه‌دهنده',
            description='توضیحات',
            urgency='high',
        )

        # لاگین به‌عنوان ارائه‌دهنده
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.provider_token}')
        response = self.client.get('/api/services/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get('results', response.data)), 1)

    # ============ جزئیات درخواست ============

    def test_get_request_detail(self):
        """تست دریافت جزئیات درخواست"""
        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            title='درخواست تست',
            description='توضیحات تست',
            urgency='medium',
        )

        response = self.client.get(f'/api/services/requests/{req.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'درخواست تست')

    # ============ ویرایش درخواست ============

    def test_update_own_request(self):
        """تست ویرایش درخواست خود"""
        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            title='عنوان قدیمی',
            description='توضیحات',
            urgency='low',
        )

        response = self.client.patch(f'/api/services/requests/{req.id}/', {
            'title': 'عنوان جدید',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ============ امنیت ============

    def test_cannot_access_others_request(self):
        """تست عدم دسترسی به درخواست دیگران"""
        other_user = User.objects.create_user(
            phone_number='09120000003',
            password='testpass123',
            role='buyer'
        )
        req = ServiceRequest.objects.create(
            buyer=other_user,
            title='درخواست دیگران',
            description='توضیحات',
            urgency='low',
        )

        response = self.client.get(f'/api/services/requests/{req.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated(self):
        """تست دسترسی بدون توکن"""
        client = APIClient()
        response = client.get('/api/services/requests/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ============ اعلام قیمت توسط ارائه‌دهنده ============

    def test_provider_quote(self):
        """تست اعلام قیمت توسط ارائه‌دهنده"""
        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            service=self.service,
            title='درخواست',
            description='توضیحات',
            urgency='medium',
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.provider_token}')
        response = self.client.post(f'/api/services/requests/{req.id}/provider_quote/', {
            'quoted_price': 50000000,
            'provider_notes': 'هزینه تعمیر کامل',
            'estimated_completion_date': '2025-06-15',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        req.refresh_from_db()
        self.assertEqual(req.status, 'quoted')
        quote = req.quotes.get(provider=self.provider)
        self.assertEqual(quote.quoted_price, 50000000)

    def test_second_provider_can_quote_after_first_quote(self):
        """ثبت پیشنهاد ارائه‌دهنده دوم پس از اولین پیشنهاد باید ممکن باشد."""
        from notification.models import Notification

        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            service=self.service,
            title='درخواست چند پیشنهاد',
            description='توضیحات تست',
            urgency='medium',
        )
        second_provider = User.objects.create_user(
            phone_number='09120000004',
            password='testpass123',
            first_name='مریم',
            last_name='ارائه‌دهنده دوم',
            role='service_provider',
        )
        Notification.objects.create(
            user=second_provider,
            type='service_request',
            title='درخواست خدمت جدید',
            message='برای این درخواست دعوت شده‌اید',
            extra_data={'request_id': req.id},
        )

        # ارائه‌دهنده اول پیشنهاد می‌دهد و وضعیت باید quoted شود.
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.provider_token}')
        first_response = self.client.post(
            f'/api/services/requests/{req.id}/provider_quote/',
            {'quoted_price': 50000000, 'provider_notes': 'پیشنهاد اول'},
        )
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'quoted')

        # پیشنهاد دوم نیز تا پیش از انتخاب پیشنهاد توسط خریدار مجاز است.
        second_response = self.client.post(
            f'/api/token/',
            {'phone_number': '09120000004', 'password': 'testpass123'},
        )
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {second_response.data['access']}"
        )
        second_quote_response = self.client.post(
            f'/api/services/requests/{req.id}/provider_quote/',
            {'quoted_price': 45000000, 'provider_notes': 'پیشنهاد دوم'},
        )
        self.assertEqual(second_quote_response.status_code, status.HTTP_200_OK)
        self.assertEqual(req.quotes.count(), 2)

    # ============ انتخاب پیشنهاد و گردش اجرای خدمت ============

    def test_accept_quote_without_service_creates_invoice_for_selected_provider(self):
        """درخواست بدون سرویس اولیه باید بتواند پیشنهاد را بپذیرد و فاکتور صحیح بسازد."""
        from payment.models import Invoice

        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            service=None,
            title='درخواست بدون سرویس اولیه',
            description='نیازمند ارزیابی و پیشنهاد',
            urgency='medium',
            status='quoted',
        )
        quote = ServiceRequestQuote.objects.create(
            service_request=req,
            provider=self.provider,
            quoted_price=1250000,
            provider_notes='پیشنهاد منتخب',
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')
        response = self.client.post(
            f'/api/services/requests/{req.id}/accept_quote/',
            {'quote_id': quote.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        req.refresh_from_db()
        quote.refresh_from_db()
        invoice = Invoice.objects.get(service_request=req)
        self.assertEqual(req.status, ServiceRequest.Status.ACCEPTED)
        self.assertEqual(req.final_price, quote.quoted_price)
        self.assertTrue(quote.is_selected)
        self.assertEqual(invoice.seller_id, self.provider.id)
        self.assertEqual(invoice.total, quote.quoted_price)

    def test_selected_provider_can_start_and_complete_request_without_service(self):
        """درخواست بدون سرویس باید توسط ارائه‌دهنده پیشنهاد منتخب اجرا و تکمیل شود."""
        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            service=None,
            title='درخواست اجرای بدون سرویس',
            description='شرح درخواست',
            urgency='medium',
            status='quoted',
        )
        quote = ServiceRequestQuote.objects.create(
            service_request=req,
            provider=self.provider,
            quoted_price=900000,
            is_selected=True,
        )
        req.status = ServiceRequest.Status.ACCEPTED
        req.save(update_fields=['status', 'updated_at'])

        other_provider = User.objects.create_user(
            phone_number='09120000005',
            password='testpass123',
            role='service_provider',
        )
        other_response = self.client.post(
            f'/api/token/',
            {'phone_number': '09120000005', 'password': 'testpass123'},
        )
        self.assertEqual(other_response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {other_response.data['access']}"
        )
        denied = self.client.post(f'/api/services/requests/{req.id}/start_work/')
        self.assertNotEqual(denied.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.provider_token}')
        start_response = self.client.post(f'/api/services/requests/{req.id}/start_work/')
        self.assertEqual(start_response.status_code, status.HTTP_200_OK, start_response.data)

        complete_response = self.client.post(
            f'/api/services/requests/{req.id}/complete/',
            {'completion_notes': 'گزارش انجام کار ثبت شد'},
            format='json',
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK, complete_response.data)
        req.refresh_from_db()
        self.assertEqual(req.status, ServiceRequest.Status.COMPLETED)
        self.assertEqual(req.completion_notes, 'گزارش انجام کار ثبت شد')

    def test_quote_cannot_be_selected_twice(self):
        """پس از انتخاب پیشنهاد اول، انتخاب پیشنهاد دوم برای همان درخواست رد شود."""
        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            service=self.service,
            title='درخواست با دو پیشنهاد',
            description='شرح درخواست',
            urgency='medium',
            status='quoted',
        )
        second_provider = User.objects.create_user(
            phone_number='09120000006',
            password='testpass123',
            role='service_provider',
        )
        first_quote = ServiceRequestQuote.objects.create(
            service_request=req, provider=self.provider, quoted_price=1000000
        )
        second_quote = ServiceRequestQuote.objects.create(
            service_request=req, provider=second_provider, quoted_price=1100000
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')
        first_response = self.client.post(
            f'/api/services/requests/{req.id}/accept_quote/',
            {'quote_id': first_quote.id},
            format='json',
        )
        self.assertEqual(first_response.status_code, status.HTTP_200_OK, first_response.data)

        second_response = self.client.post(
            f'/api/services/requests/{req.id}/accept_quote/',
            {'quote_id': second_quote.id},
            format='json',
        )
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(req.quotes.filter(is_selected=True).count(), 1)

    # ============ آپلود پیوست ============

    def test_upload_attachment(self):
        """تست آپلود فایل پیوست"""
        import tempfile
        from django.core.files.uploadedfile import SimpleUploadedFile

        req = ServiceRequest.objects.create(
            buyer=self.buyer,
            title='درخواست با پیوست',
            description='توضیحات',
            urgency='high',
        )

        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg')
        temp_file.write(b'fake image content')
        temp_file.seek(0)

        response = self.client.post(
            f'/api/services/requests/{req.id}/upload_attachment/',
            {'file': temp_file, 'description': 'عکس پمپ'},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)