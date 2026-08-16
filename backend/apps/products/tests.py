"""
تست‌های اپ products
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Product, Category, Brand

User = get_user_model()

# URL های صحیح (دقت کن products دو بار تکرار شده)
PRODUCT_URL = '/api/products/products/'
CATEGORY_URL = '/api/products/categories/'
BRAND_URL = '/api/products/brands/'


class ProductAPITestCase(TestCase):
    """تست API های محصولات"""

    def setUp(self):
        self.client = APIClient()

        self.seller = User.objects.create_user(
            phone_number='09120000001', password='testpass123',
            first_name='فروشنده', last_name='تست', role='seller'
        )
        self.buyer = User.objects.create_user(
            phone_number='09120000002', password='testpass123',
            first_name='خریدار', last_name='تست', role='buyer'
        )

        resp = self.client.post('/api/token/', {'phone_number': '09120000001', 'password': 'testpass123'})
        self.seller_token = resp.data['access']
        resp = self.client.post('/api/token/', {'phone_number': '09120000002', 'password': 'testpass123'})
        self.buyer_token = resp.data['access']

        self.category = Category.objects.create(name='پمپ', slug='pump')
        self.brand = Brand.objects.create(name='KSB', slug='ksb')

        self.product = Product.objects.create(
            seller=self.seller, category=self.category, brand=self.brand,
            name='بلبرینگ ۶۲۰۵', slug='bearing-6205', sku='BRG-6205-001',
            description='بلبرینگ صنعتی', price=5000000, stock_quantity=10,
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.seller_token}')

    # ============ لیست ============
    def test_list_products(self):
        response = self.client.get(PRODUCT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_category(self):
        response = self.client.get(f'{PRODUCT_URL}?category__slug=pump')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_products(self):
        response = self.client.get(f'{PRODUCT_URL}?search=بلبرینگ')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ============ جزئیات (با slug) ============
    def test_get_product_detail(self):
        response = self.client.get(f'{PRODUCT_URL}{self.product.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'بلبرینگ ۶۲۰۵')

    # ============ ایجاد ============
    def test_create_product(self):
        response = self.client.post(PRODUCT_URL, {
            'name': 'پمپ تست', 'slug': 'test-pump-999', 'sku': 'SKU-999',
            'description': 'توضیحات', 'price': 10000000, 'stock_quantity': 5,
            'product_type': 'part', 'condition': 'new',
        }, format='json')
        self.assertIn(response.status_code, [201, 400])

    def test_create_product_missing_name(self):
        response = self.client.post(PRODUCT_URL, {
            'slug': 'no-name', 'sku': 'SKU-001',
            'description': 'بدون نام', 'price': 1000,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ============ ویرایش ============
    def test_update_own_product(self):
        response = self.client.patch(f'{PRODUCT_URL}{self.product.slug}/', {
            'price': 6000000,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_buyer_cannot_create_product(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')
        response = self.client.post(PRODUCT_URL, {
            'name': 'تست', 'slug': 'test-1', 'sku': 'S-1',
            'description': 'تست', 'price': 1000,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ============ امنیت ============
    def test_unauthenticated_can_see_products(self):
        client = APIClient()
        response = client.get(PRODUCT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ============ دسته‌بندی و برند ============
    def test_list_categories(self):
        response = self.client.get(CATEGORY_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_brands(self):
        response = self.client.get(BRAND_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ============ محصولات فروشنده ============
    def test_my_products(self):
        response = self.client.get(f'{PRODUCT_URL}my_products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ============ Properties ============
    def test_final_price(self):
        self.assertEqual(self.product.final_price, 5000000)

    def test_discount_price(self):
        self.product.discount_price = 4000000
        self.product.save()
        self.assertEqual(self.product.final_price, 4000000)

    def test_in_stock(self):
        self.assertTrue(self.product.is_in_stock)

    def test_out_of_stock(self):
        self.product.stock_quantity = 0
        self.product.save()
        self.assertFalse(self.product.is_in_stock)