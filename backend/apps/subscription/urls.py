from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, SubscriptionViewSet

router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]

# 🆕 action endpoints جداگانه - اینو اینجا بذار:
urlpatterns += [
    path('active/', SubscriptionViewSet.as_view({'get': 'active'}), name='subscription-active'),
    path('my-subscription/', SubscriptionViewSet.as_view({'get': 'my_subscription'}), name='my-subscription'),
    path('usage-stats/', SubscriptionViewSet.as_view({'get': 'usage_stats'}), name='usage-stats'),
    path('upgrade/', SubscriptionViewSet.as_view({'post': 'upgrade'}), name='upgrade'),
    path('cancel/', SubscriptionViewSet.as_view({'post': 'cancel'}), name='cancel'),
]