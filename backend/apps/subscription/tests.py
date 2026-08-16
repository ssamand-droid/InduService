# فایل: apps/subscription/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from subscription.models import Plan, Subscription

User = get_user_model()

class SubscriptionTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            phone_number='09120000001', password='pass', role='buyer'
        )
        
    def test_default_plans_exist(self):
        """تست وجود طرح‌های پیش‌فرض"""
        self.assertTrue(Plan.objects.filter(slug='free').exists())
        self.assertTrue(Plan.objects.filter(slug='pro').exists())
        self.assertTrue(Plan.objects.filter(slug='enterprise').exists())
    
    def test_free_plan_limits(self):
        """تست محدودیت طرح رایگان"""
        free = Plan.objects.get(slug='free')
        self.assertEqual(free.max_assets, 5)
        self.assertEqual(free.price_monthly, 0)
    
    def test_pro_plan_unlimited(self):
        """تست طرح حرفه‌ای"""
        pro = Plan.objects.get(slug='pro')
        self.assertGreater(pro.max_assets, 1000)
        self.assertTrue(pro.has_predictive_maintenance)
    
    def test_create_trial_subscription(self):
        """تست ایجاد اشتراک آزمایشی"""
        free_plan = Plan.objects.get(slug='free')
        sub = Subscription.objects.create(
            user=self.user,
            plan=free_plan,
            status=Subscription.Status.TRIAL,
        )
        self.assertTrue(sub.is_active_subscription)
        self.assertEqual(sub.max_assets_allowed, 5)
    
    def test_active_subscription_lookup(self):
        """تست یافتن اشتراک فعال"""
        pro_plan = Plan.objects.get(slug='pro')
        Subscription.objects.create(
            user=self.user, plan=pro_plan,
            status=Subscription.Status.ACTIVE,
        )
        active = Subscription.get_active_subscription(self.user)
        self.assertIsNotNone(active)
        self.assertEqual(active.plan.slug, 'pro')