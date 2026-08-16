"""
تست‌های اپ services - درخواست خدمت
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from services.models import (
    ServiceCategory, Service, ServiceRequest, ServiceRequestAttachment
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
        self.assertEqual(req.quoted_price, 50000000)

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