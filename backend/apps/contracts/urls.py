from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceContractViewSet, EquipmentTransferViewSet

router = DefaultRouter()
router.register(r'contracts', ServiceContractViewSet)
router.register(r'transfers', EquipmentTransferViewSet)

urlpatterns = [
    path('', include(router.urls)),
]