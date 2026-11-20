from django.contrib import admin
from .models import RFQ, RFQLine, SupplierQuote, SupplierQuoteLine, PurchaseOrder, PurchaseOrderLine, GoodsReceipt, GoodsReceiptLine, Shipment, SupplierInvoice, ProcurementPayment

admin.site.register((RFQ, RFQLine, SupplierQuote, SupplierQuoteLine, PurchaseOrder, PurchaseOrderLine, GoodsReceipt, GoodsReceiptLine, Shipment, SupplierInvoice, ProcurementPayment))
