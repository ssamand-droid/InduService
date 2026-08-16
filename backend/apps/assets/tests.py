from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from assets.models import (
    Asset, AssetPart, AssetMaintenanceLog, AssetAlert,
    Sensor, AssetDocument
)

User = get_user_model()

class AssetAPITestCase(TestCase):
    """تست کامل API های مدیریت دارایی"""

    def setUp(self):
        """آماده‌سازی داده‌های تست"""
        self.client = APIClient()

        # ایجاد کاربر تست
        self.user = User.objects.create_user(
            phone_number='09120000001',
            password='testpass123',
            role='buyer'
        )

        # لاگین و گرفتن توکن
        response = self.client.post('/api/token/', {
            'phone_number': '09120000001',
            'password': 'testpass123'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # ایجاد یک دارایی نمونه
        self.asset = Asset.objects.create(
            owner=self.user,
            name='پمپ تست',
            tag_number='TEST-001',
            brand='KSB',
            model_number='Etanorm 100'
        )

    def test_create_asset(self):
        """تست ایجاد دارایی جدید"""
        response = self.client.post('/api/assets/all/', {
            'name': 'موتور تست',
            'tag_number': 'TEST-002',
            'brand': 'Siemens'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_assets(self):
        """تست لیست دارایی‌ها"""
        response = self.client.get('/api/assets/all/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_asset_detail(self):
        """تست جزئیات دارایی"""
        response = self.client.get(f'/api/assets/all/{self.asset.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'پمپ تست')

    def test_update_asset(self):
        """تست ویرایش دارایی"""
        response = self.client.patch(f'/api/assets/all/{self.asset.id}/', {
            'brand': 'KSB Updated'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_emergency_stop(self):
        """تست وضعیت اضطراری"""
        response = self.client.post(f'/api/assets/assets/{self.asset.id}/emergency_stop/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, 'maintenance')

    def test_global_dashboard(self):
        """تست داشبورد"""
        response = self.client.get('/api/assets/assets/global_dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated(self):
        """تست بدون توکن"""
        client = APIClient()
        response = client.get('/api/assets/all/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_download_template(self):
        """تست دانلود قالب"""
        response = self.client.get('/api/assets/assets/download_template/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)