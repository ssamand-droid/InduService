# apps/payment/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, CommissionRuleViewSet, WalletViewSet, SettlementViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'commission-rules', CommissionRuleViewSet, basename='commission-rule')
router.register(r'wallets', WalletViewSet, basename='wallet')
router.register(r'settlements', SettlementViewSet, basename='settlement')
urlpatterns = [
    path('', include(router.urls)),
]