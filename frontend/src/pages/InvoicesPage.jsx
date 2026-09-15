// src/pages/InvoicesPage.jsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiFileText, FiEye } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Modal } from '@components/ui'
import api from '@lib/axios'
import { formatPriceSafe as formatPrice, formatDateSafe as formatDate } from '@lib/utils'

export default function InvoicesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/api/payment/invoices/').then(r => r.data),
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-custom py-8 max-w-6xl mx-auto">
        <Card className="text-center py-12 bg-red-50">
          <p className="text-red-600">خطا در دریافت اطلاعات فاکتورها</p>
          <p className="text-sm text-red-500 mt-2">{error.message}</p>
        </Card>
      </div>
    )
  }

  const invoices = data?.results || []

  const statusLabels = {
    draft: 'پیش‌نویس',
    issued: 'صادر شده',
    paid: 'پرداخت شده',
    partially_paid: 'پرداخت جزئی',
    cancelled: 'باطل شده'
  }

  const statusColors = {
    draft: 'secondary',
    issued: 'warning',
    paid: 'success',
    partially_paid: 'info',
    cancelled: 'danger'
  }

  if (invoices.length === 0) {
    return (
      <div className="container-custom py-8 max-w-6xl mx-auto">
        <h1 className="heading-2 mb-6 flex items-center gap-2">
          <FiFileText className="text-primary-600" /> فاکتورها و صورت‌حساب‌ها
        </h1>
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-secondary-500">فاکتوری یافت نشد</p>
          <p className="text-secondary-400 text-sm mt-2">پس از پذیرش قیمت و ایجاد فاکتور، اینجا نمایش داده می‌شود</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container-custom py-8 max-w-6xl mx-auto">
      <h1 className="heading-2 mb-6 flex items-center gap-2">
        <FiFileText className="text-primary-600" /> فاکتورها و صورت‌حساب‌ها
      </h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr className="text-right text-sm font-medium text-secondary-500">
                <th className="p-3">شماره فاکتور</th>
                <th className="p-3">خریدار</th>
                <th className="p-3">فروشنده</th>
                <th className="p-3">مبلغ کل</th>
                <th className="p-3">پیش‌پرداخت</th>
                <th className="p-3">باقی‌مانده</th>
                <th className="p-3">کمیسیون</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="text-sm hover:bg-secondary-50 dark:hover:bg-secondary-800 transition">
                  <td className="p-3 font-medium">{inv.invoice_number || '---'}</td>
                  <td className="p-3">{inv.buyer_name || '---'}</td>
                  <td className="p-3">{inv.seller_name || '---'}</td>
                  <td className="p-3 font-bold text-primary-600">{formatPrice(inv.total)}</td>
                  <td className="p-3">{formatPrice(inv.advance_payment)}</td>
                  <td className="p-3 font-medium text-green-600">{formatPrice(inv.remaining_amount)}</td>
                  <td className="p-3 text-secondary-500">
                    {formatPrice(inv.platform_commission_amount)} ({inv.platform_commission_rate || 0}%)
                  </td>
                  <td className="p-3">
                    <Badge variant={statusColors[inv.status] || 'secondary'} size="sm">
                      {statusLabels[inv.status] || inv.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-secondary-500 text-xs">{formatDate(inv.issued_at || inv.created_at)}</td>
                  <td className="p-3">
                    <InvoiceDetailButton invoice={inv} statusLabels={statusLabels} statusColors={statusColors} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ========================
// Invoice Detail Modal - اصلاح شده
// ========================
const InvoiceDetailButton = ({ invoice, statusLabels, statusColors }) => {
  const [isOpen, setIsOpen] = useState(false)

  // محاسبات امن
  const total = Number(invoice.total) || 0
  const commissionAmount = Number(invoice.platform_commission_amount) || 0
  const sellerReceives = total - commissionAmount
  const invoiceDate = invoice.issued_at || invoice.created_at

  // تابع امن فرمت عدد
  const formatNumber = (num) => {
    const n = Number(num) || 0
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
  }

  const handlePrint = () => {
      const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاکتور ${invoice.invoice_number}</title><style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Vazirmatn',sans-serif;direction:rtl;padding:40px;color:#1e293b;background:#fff}
        .header{border-bottom:2px solid #1e293b;padding-bottom:20px;margin-bottom:30px}
        .header h1{color:#1e293b;font-size:28px;margin-bottom:5px}
        .header p{color:#64748b;font-size:14px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:30px}
        .info-box{background:#f8fafc;padding:15px;border-radius:8px;border:1px solid #e2e8f0}
        .info-box .label{color:#64748b;font-size:11px;margin-bottom:3px}
        .info-box .value{font-weight:700;font-size:14px;color:#1e293b}
        table{width:100%;border-collapse:collapse;margin-bottom:30px}
        th{background:#f1f5f9;padding:12px;text-align:right;font-size:13px;color:#1e293b;border-bottom:2px solid #cbd5e1}
        td{padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px}
        .total-row td{font-weight:700;font-size:16px;background:#f8fafc}
        .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px}
        .stamp{color:#1e293b;font-size:12px;margin-top:10px}
        @media print{body{padding:20px}}
      </style></head><body>
        <div class="header"><h1>🧾 فاکتور رسمی</h1><p>InduService - مارکت‌پلیس خدمات صنعتی</p></div>
        <div class="info-grid">
          <div class="info-box"><div class="label">شماره فاکتور</div><div class="value">${invoice.invoice_number}</div></div>
          <div class="info-box"><div class="label">تاریخ صدور</div><div class="value">${formatDate(invoiceDate)}</div></div>
          <div class="info-box"><div class="label">خریدار</div><div class="value">${invoice.buyer_name || '---'}</div></div>
          <div class="info-box"><div class="label">فروشنده</div><div class="value">${invoice.seller_name || '---'}</div></div>
          <div class="info-box"><div class="label">وضعیت</div><div class="value">${statusLabels[invoice.status] || invoice.status}</div></div>
        </div>
        <table>
          <thead><tr><th>ردیف</th><th>شرح</th><th>مبلغ (ریال)</th><th>توضیحات</th></tr></thead>
          <tbody>
            <tr><td>۱</td><td>مبلغ کل خدمت</td><td>${formatNumber(total)}</td><td>قیمت اعلام شده</td></tr>
            <tr><td>۲</td><td>پیش‌پرداخت</td><td>- ${formatNumber(invoice.advance_payment)}</td><td>پرداخت شده</td></tr>
            <tr class="total-row"><td>۳</td><td>باقی‌مانده</td><td>${formatNumber(invoice.remaining_amount)}</td><td>مبلغ قابل پرداخت</td></tr>
            <tr><td>۴</td><td>نرخ کمیسیون</td><td>${invoice.platform_commission_rate || 0}%</td><td>تعیین شده</td></tr>
            <tr><td>۵</td><td>کمیسیون پلتفرم</td><td>- ${formatNumber(commissionAmount)}</td><td></td></tr>
            <tr class="total-row"><td>۶</td><td>واریزی به فروشنده</td><td>${formatNumber(sellerReceives)}</td><td>total - commission</td></tr>
          </tbody>
        </table>
        <div class="footer"><p>این فاکتور توسط سامانه InduService صادر شده است.</p><div class="stamp">🔒 این فاکتور فاقد امضای فیزیکی بوده و کد پیگیری آن معتبر می‌باشد.</div></div>
        <script>window.print();</script>
      </body></html>`

      const w = window.open('', '_blank', 'width=800,height=600')
      if (w) {
        w.document.write(html)
        w.document.close()
      }
  }

  const formatPrice = (price) => {
      const num = Number(price) || 0
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + ' ریال'
  }

  return (
    <>
      <Button variant="ghost" size="xs" onClick={() => setIsOpen(true)}>
        <FiEye className="h-4 w-4" />
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`جزئیات فاکتور ${invoice.invoice_number}`} size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
            <div><p className="text-xs text-secondary-500">شماره فاکتور</p><p className="font-bold text-lg">{invoice.invoice_number}</p></div>
            <div><p className="text-xs text-secondary-500">وضعیت</p><Badge variant={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Badge></div>
            <div><p className="text-xs text-secondary-500">خریدار</p><p className="font-medium">{invoice.buyer_name || '---'}</p></div>
            <div><p className="text-xs text-secondary-500">فروشنده</p><p className="font-medium">{invoice.seller_name || '---'}</p></div>
            <div><p className="text-xs text-secondary-500">تاریخ صدور</p><p>{formatDate(invoiceDate)}</p></div>
            <div><p className="text-xs text-secondary-500">تاریخ پرداخت</p><p>{invoice.paid_at ? formatDate(invoice.paid_at) : '---'}</p></div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">💰 محاسبات مالی</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-blue-50 dark:bg-blue-900/20">
                  <tr><th className="p-2 text-right">ردیف</th><th className="p-2 text-right">شرح</th><th className="p-2 text-right">مبلغ (ریال)</th><th className="p-2 text-right">توضیحات</th></tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="p-2">۱</td><td className="p-2">مبلغ کل خدمت</td><td className="p-2 font-bold text-primary-600">{formatPrice(total)}</td><td className="p-2 text-xs text-secondary-500">قیمت اعلام شده</td></tr>
                  <tr className="bg-yellow-50 dark:bg-yellow-900/10"><td className="p-2">۲</td><td className="p-2">پیش‌پرداخت</td><td className="p-2 font-medium text-yellow-600">- {formatPrice(invoice.advance_payment)}</td><td className="p-2 text-xs text-secondary-500">پرداخت شده</td></tr>
                  <tr className="bg-green-50 dark:bg-green-900/10"><td className="p-2">۳</td><td className="p-2">باقی‌مانده</td><td className="p-2 font-bold text-green-600">{formatPrice(invoice.remaining_amount)}</td><td className="p-2 text-xs text-secondary-500">مبلغ قابل پرداخت</td></tr>
                  <tr><td className="p-2">۴</td><td className="p-2">نرخ کمیسیون</td><td className="p-2">{invoice.platform_commission_rate || 0}%</td><td className="p-2 text-xs text-secondary-500">تعیین شده</td></tr>
                  <tr className="bg-red-50 dark:bg-red-900/10"><td className="p-2">۵</td><td className="p-2">کمیسیون پلتفرم</td><td className="p-2 font-medium text-red-600">- {formatPrice(commissionAmount)}</td><td className="p-2 text-xs text-secondary-500"></td></tr>
                  <tr className="bg-green-50 dark:bg-green-900/20"><td className="p-2">۶</td><td className="p-2">واریزی به فروشنده</td><td className="p-2 font-bold text-green-600 text-lg">{formatPrice(sellerReceives)}</td><td className="p-2 text-xs text-secondary-500">مجموع</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {invoice.payment_receipt && (
            <div><h4 className="font-semibold mb-2">📎 رسید پرداخت</h4><img src={invoice.payment_receipt} alt="رسید" className="max-h-48 rounded-lg border" /></div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium mb-2">📐 فرمول‌های محاسباتی</p>
              <ul className="space-y-1 text-secondary-600 dark:text-secondary-400 text-xs">
                <li>• مبلغ باقی‌مانده = مبلغ کل - پیش‌پرداخت</li>
                <li>• کمیسیون = مبلغ کل × نرخ کمیسیون ÷ ۱۰۰</li>
                <li>• مبلغ واریزی به فروشنده = مبلغ کل - کمیسیون</li>
              </ul>
            </div>
            <Button variant="primary" size="sm" onClick={handlePrint}>🖨️ پرینت فاکتور</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}