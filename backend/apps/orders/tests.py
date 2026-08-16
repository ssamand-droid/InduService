"""
تست‌های اپ orders - سفارشات
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from orders.models import Order, MROWorkflowStep

User = get_user_model()

# URL صحیح بر اساس Swagger
ORDER_URL = '/api/orders/orders/'


class OrderAPITestCase(TestCase):
    """تست API های سفارشات"""

    def setUp(self):
        self.client = APIClient()

        self.buyer = User.objects.create_user(
            phone_number='09120000001', password='testpass123',
            first_name='علی', last_name='خریدار', role='buyer'
        )
        self.seller = User.objects.create_user(
            phone_number='09120000002', password='testpass123',
            first_name='رضا', last_name='فروشنده', role='seller'
        )

        response = self.client.post('/api/token/', {
            'phone_number': '09120000001', 'password': 'testpass123'
        })
        self.buyer_token = response.data['access']

        response = self.client.post('/api/token/', {
            'phone_number': '09120000002', 'password': 'testpass123'
        })
        self.seller_token = response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')

        self.order = Order.objects.create(
            buyer=self.buyer, seller=self.seller,
            status=Order.OrderStatus.DRAFT,
            shipping_address='تهران', shipping_city='تهران',
            shipping_postal_code='12345', receiver_name='علی',
            receiver_phone='09120000001',
        )

    # ============ لیست و جزئیات ============

    def test_list_my_orders(self):
        response = self.client.get(ORDER_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_seller_sees_their_orders(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')
        response = self.client.get(ORDER_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_order_detail(self):
        response = self.client.get(f'{ORDER_URL}{self.order.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'draft')

    def test_order_number_auto_generated(self):
        self.assertIsNotNone(self.order.order_number)
        self.assertTrue(self.order.order_number.startswith('ORD-'))

    # ============ امنیت ============

    def test_cannot_access_others_order(self):
        other = User.objects.create_user(
            phone_number='0999', password='pass', role='buyer'
        )
        other_order = Order.objects.create(
            buyer=other, seller=self.seller,
            shipping_address='آدرس', shipping_city='شهر',
            shipping_postal_code='12345', receiver_name='دیگری',
            receiver_phone='0912',
        )
        response = self.client.get(f'{ORDER_URL}{other_order.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated(self):
        client = APIClient()
        response = client.get(ORDER_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ============ تغییر وضعیت ============

    def test_order_confirm(self):
        self.order.status = Order.OrderStatus.PENDING
        self.order.save()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')
        response = self.client.post(f'{ORDER_URL}{self.order.id}/confirm/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')

    def test_order_ship(self):
        self.order.status = Order.OrderStatus.CONFIRMED
        self.order.save()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')
        response = self.client.post(f'{ORDER_URL}{self.order.id}/ship/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'shipped')

    # ============ MRO ============

    def test_add_mro_step(self):
        """تست افزودن مرحله MRO"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')
        response = self.client.post(f'{ORDER_URL}{self.order.id}/add_mro_step/', {
            'step_type': 'inspection',
            'title': 'بازرسی اولیه',
            'description': 'بررسی وضعیت دستگاه',
            'order_index': 1,
            'status': 'pending',
        })
        # اگر بازم ۴۰۰ بود، خطا رو چاپ کن
        if response.status_code != 201:
            print('MRO Error:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_mro_step(self):
        step = MROWorkflowStep.objects.create(
            order=self.order, step_type='inspection',
            title='بازرسی', order_index=1, status='pending',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')
        response = self.client.patch(
            f'{ORDER_URL}{self.order.id}/mro-step/{step.id}/',
            {'status': 'completed'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)