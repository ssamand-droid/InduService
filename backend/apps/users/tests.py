"""
تست‌های کامل برای اپ users
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class UserAPITestCase(TestCase):
    """تست کامل API های کاربران"""

    def setUp(self):
        self.client = APIClient()
        
        # ایجاد کاربر تست
        self.user = User.objects.create_user(
            phone_number='09120000001',
            password='testpass123',
            first_name='علی',
            last_name='محمدی',
            role='buyer'
        )
        
        # لاگین
        response = self.client.post('/api/token/', {
            'phone_number': '09120000001',
            'password': 'testpass123'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    # ============ ثبت نام ============
    
    def test_register_user(self):
        """تست ثبت نام کاربر جدید"""
        response = self.client.post('/api/users/register/', {
            'phone_number': '09120000002',
            'password': 'testpass456',
            'password_confirm': 'testpass456',
            'first_name': 'رضا',
            'last_name': 'احمدی',
            'role': 'buyer',
            'person_type': 'individual',  # 🆕
        })
        print('Status:', response.status_code)
        print('Data:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_duplicate_phone(self):
        """تست ثبت نام با شماره تکراری"""
        response = self.client.post('/api/users/register/', {
            'phone_number': '09120000001',  # تکراری
            'password': 'testpass456',
            'password2': 'testpass456',
            'first_name': 'رضا',
            'last_name': 'احمدی',
            'role': 'buyer'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ============ لاگین ============
    
    def test_login_success(self):
        """تست لاگین موفق"""
        response = self.client.post('/api/token/', {
            'phone_number': '09120000001',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        """تست لاگین با رمز اشتباه"""
        response = self.client.post('/api/token/', {
            'phone_number': '09120000001',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_wrong_phone(self):
        """تست لاگین با شماره اشتباه"""
        response = self.client.post('/api/token/', {
            'phone_number': '09120000099',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ============ پروفایل ============
    
    def test_get_profile(self):
        """تست دریافت پروفایل"""
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_profile(self):
        """تست ویرایش پروفایل"""
        response = self.client.patch('/api/users/profile/', {
            'bio': 'تکنسین با ۱۰ سال تجربه',
            'city': 'تهران'
        })
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    # ============ دسترسی‌ها ============
    
    def test_unauthenticated_access(self):
        """تست دسترسی بدون توکن"""
        client = APIClient()
        response = client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        """تست رفرش توکن"""
        login_res = self.client.post('/api/token/', {
            'phone_number': '09120000001',
            'password': 'testpass123'
        })
        refresh = login_res.data['refresh']
        
        response = self.client.post('/api/token/refresh/', {
            'refresh': refresh
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)