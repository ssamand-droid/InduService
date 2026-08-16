from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceCategoryViewSet, ServiceViewSet, ServiceRequestViewSet,ServiceMatchView


router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='service-category')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'requests', ServiceRequestViewSet, basename='service-request')

urlpatterns = [
    path('', include(router.urls)),
    path('match/', ServiceMatchView.as_view(), name='service-match'),
]