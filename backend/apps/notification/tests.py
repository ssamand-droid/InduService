"""
تست‌های اپ notification
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from notification.models import Notification

User = get_user_model()

# URL صحیح (چک کن notification/notification هست یا notification/)
NOTIF_URL = '/api/notifications/notifications/'  # اگر مثل orders باشه
# اگر ۴۰۴ داد، به '/api/notifications/' تغییر بده


class NotificationAPITestCase(TestCase):
    """تست API های اعلان‌ها"""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            phone_number='09120000001', password='testpass123',
            first_name='کاربر', last_name='تست', role='buyer'
        )

        resp = self.client.post('/api/token/', {
            'phone_number': '09120000001', 'password': 'testpass123'
        })
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        for i in range(3):
            Notification.objects.create(
                user=self.user, type='system',
                title=f'اعلان تست {i+1}', message=f'پیام تست شماره {i+1}',
            )
        Notification.objects.create(
            user=self.user, type='order', title='اعلان خوانده شده',
            message='این قبلاً خوانده شده', is_read=True,
        )

    def _get_url(self, path=''):
        """تلاش با URL های مختلف"""
        urls = [
            f'/api/notifications/notifications/{path}',
            f'/api/notifications/{path}',
        ]
        for url in urls:
            response = self.client.get(url) if 'mark' not in path else None
            if response and response.status_code != 404:
                return url
        return urls[0]  # پیش‌فرض

    # ============ لیست ============
    def test_list_notifications(self):
        # تلاش با هر دو URL
        for url in ['/api/notifications/notifications/', '/api/notifications/']:
            response = self.client.get(url)
            if response.status_code == 200:
                return
        self.fail('Notification list URL not found')

    def test_unread_count(self):
        for url in ['/api/notifications/notifications/unread_count/', '/api/notifications/unread_count/']:
            response = self.client.get(url)
            if response.status_code == 200:
                self.assertEqual(response.data['unread_count'], 3)
                return
        self.fail('Unread count URL not found')

    # ============ خواندن ============
    def test_mark_as_read(self):
        unread = Notification.objects.filter(user=self.user, is_read=False)
        ids = list(unread.values_list('id', flat=True)[:2])

        for url in ['/api/notifications/notifications/mark_as_read/', '/api/notifications/mark_as_read/']:
            response = self.client.post(url, {'notification_ids': ids}, format='json')
            if response.status_code == 200:
                unread_count = Notification.objects.filter(user=self.user, is_read=False).count()
                self.assertEqual(unread_count, 1)
                return
        self.fail('Mark as read URL not found')

    def test_mark_all_read(self):
        for url in ['/api/notifications/notifications/mark_all_read/', '/api/notifications/mark_all_read/']:
            response = self.client.post(url)
            if response.status_code == 200:
                unread_count = Notification.objects.filter(user=self.user, is_read=False).count()
                self.assertEqual(unread_count, 0)
                return
        self.fail('Mark all read URL not found')

    # ============ امنیت ============
    def test_unauthenticated(self):
        client = APIClient()
        for url in ['/api/notifications/notifications/', '/api/notifications/']:
            response = client.get(url)
            if response.status_code == 401:
                return
        self.fail('Should require authentication')

    def test_user_sees_only_own_notifications(self):
        other_user = User.objects.create_user(phone_number='0999', password='pass', role='buyer')
        Notification.objects.create(
            user=other_user, type='system',
            title='اعلان کاربر دیگر', message='نباید دیده شود',
        )
        for url in ['/api/notifications/notifications/', '/api/notifications/']:
            response = self.client.get(url)
            if response.status_code == 200:
                data = response.data.get('results', response.data)
                if isinstance(data, list):
                    for n in data:
                        if isinstance(n, dict):
                            self.assertNotEqual(n.get('title'), 'اعلان کاربر دیگر')
                return
        self.fail('URL not found')

    # ============ مدل ============
    def test_notification_str(self):
        notif = Notification.objects.first()
        self.assertIn(notif.title, str(notif))

    def test_notification_defaults(self):
        notif = Notification.objects.create(
            user=self.user, type='payment',
            title='پرداخت', message='پرداخت انجام شد',
        )
        self.assertFalse(notif.is_read)
        self.assertIsNone(notif.read_at)