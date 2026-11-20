from rest_framework.routers import DefaultRouter
from .views import RFQViewSet, SupplierQuoteViewSet, PurchaseOrderViewSet, GoodsReceiptViewSet, ShipmentViewSet, SupplierInvoiceViewSet, ProcurementPaymentViewSet, LedgerAccountViewSet, LedgerJournalViewSet

router = DefaultRouter()
router.register('rfqs', RFQViewSet, basename='rfq')
router.register('quotes', SupplierQuoteViewSet, basename='supplier-quote')
router.register('purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register('goods-receipts', GoodsReceiptViewSet, basename='goods-receipt')
router.register('shipments', ShipmentViewSet, basename='shipment')
router.register('invoices', SupplierInvoiceViewSet, basename='supplier-invoice')
router.register('payments', ProcurementPaymentViewSet, basename='procurement-payment')
router.register('ledger/accounts', LedgerAccountViewSet, basename='procurement-ledger-account')
router.register('ledger/journals', LedgerJournalViewSet, basename='procurement-ledger-journal')
urlpatterns = router.urls
