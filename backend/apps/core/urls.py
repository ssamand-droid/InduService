# apps/core/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminDashboardView, AdminUserManagementView, PlatformSettingViewSet

router = DefaultRouter()
router.register(r'settings', PlatformSettingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('admin-dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin-users/', AdminUserManagementView.as_view(), name='admin-users'),
]