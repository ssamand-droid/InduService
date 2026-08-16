// src/pages/AdminFinancePage.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FiDollarSign, FiTrendingUp, FiDownload, FiCheck, FiX,
  FiEye, FiSearch, FiClock
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Card, Spinner, Badge, Button, Input, Modal } from '@components/ui'
import api from '@lib/axios'
import { formatPriceSafe as formatPrice, formatDateSafe as formatDate } from '@lib/utils'
import toast from 'react-hot-toast'

export default function AdminFinancePage() {
  const [search, setSearch] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const queryClient = useQueryClient()
  const [previewImage, setPreviewImage] = useState(null)

  // ========================
  // Dashboard Stats
  // ========================
  const { data: dashboard } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/admin-dashboard/').then(res => res.data),
    refetchInterval: 30000,
  })

  // ========================
  // Invoices
  // ========================
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => api.get('/api/payment/invoices/').then(res => res.data),
    retry: 1,
  })

  // ========================
  // Settlements
  // ========================
  const { data: settlements, isLoading: settlementsLoading, error: settlementsError } = useQuery({
    queryKey: ['admin-settlements'],
    queryFn: () => api.get('/api/payment/settlements/').then(res => res.data),
    retry: 1,
  })

  // ========================
  // Wallets
  // ========================
  const { data: wallets } = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: () => api.get('/api/payment/wallets/').then(res => res.data),
    retry: 1,
  })

  // ========================
  // Mutations
  // ========================
  const verifyPayment = useMutation({
    mutationFn: (invoiceId) => api.post(`/api/payment/invoices/${invoiceId}/verify_payment/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast.success('پرداخت تایید شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در تایید پرداخت')
    }
  })

  const rejectPayment = useMutation({
    mutationFn: (invoiceId) => api.post(`/api/payment/invoices/${invoiceId}/reject_payment/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
      toast.success('پرداخت رد شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در رد پرداخت')
    }
  })

  const approveSettlement = useMutation({
    mutationFn: (id) => api.post(`/api/payment/settlements/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settlements', 'admin-wallets'] })
      toast.success('تسویه تایید شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در تایید تسویه')
    }
  })

  const markSettlementPaid = useMutation({
    mutationFn: (id) => api.post(`/api/payment/settlements/${id}/mark_paid/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settlements', 'admin-wallets'] })
      toast.success('پرداخت شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در ثبت پرداخت')
    }
  })

  // ========================
  // Loading & Error States
  // ========================
  if (invoicesLoading || settlementsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (invoicesError || settlementsError) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 p-6 text-center">
          <p className="text-red-600">خطا در دریافت اطلاعات مالی</p>
          <p className="text-sm text-red-500 mt-2">{invoicesError?.message || settlementsError?.message}</p>
          <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
            تلاش مجدد
          </Button>
        </Card>
      </div>
    )
  }

  const finance = dashboard?.finance || {}
  const allInvoices = invoices?.results || []
  const allSettlements = settlements?.results || []
  const pendingReceipts = allInvoices.filter(inv => inv.payment_receipt && !inv.payment_verified)

  // ========================
  // Filters
  // ========================
  const filteredInvoices = allInvoices.filter(inv =>
    inv.invoice_number?.includes(search) ||
    inv.buyer_name?.includes(search) ||
    inv.seller_name?.includes(search)
  )

  const filteredSettlements = allSettlements.filter(s =>
    s.user_name?.includes(search) ||
    s.bank_name?.includes(search)
  )

  // ========================
  // Status Configs
  // ========================
  const invoiceLabels = { 
    draft: 'پیش‌نویس', 
    issued: 'صادر شده', 
    paid: 'پرداخت شده', 
    partially_paid: 'پرداخت جزئی', 
    cancelled: 'باطل شده' 
  }
  
  const invoiceColors = { 
    draft: 'secondary', 
    issued: 'warning', 
    paid: 'success', 
    partially_paid: 'info', 
    cancelled: 'danger' 
  }

  const statusLabels = { 
    pending: 'در انتظار', 
    approved: 'تایید شده', 
    paid: 'پرداخت شده', 
    rejected: 'رد شده' 
  }
  
  const statusColors = { 
    pending: 'warning', 
    approved: 'info', 
    paid: 'success', 
    rejected: 'danger' 
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">مدیریت مالی</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiDollarSign} color="bg-green-500" title="درآمد کل" value={formatPrice(finance.total_revenue || 0)} />
        <StatCard icon={FiTrendingUp} color="bg-blue-500" title="کمیسیون کل" value={formatPrice(finance.total_commission || 0)} />
        <StatCard icon={FiTrendingUp} color="bg-purple-500" title="پرداخت‌های در انتظار" value={finance.pending_payments || 0} />
        <StatCard icon={FiDollarSign} color="bg-yellow-500" title="تسویه‌های در انتظار" value={allSettlements.filter(s => s.status === 'pending').length || 0} />
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <Input 
            placeholder="جستجو بر اساس شماره فاکتور، خریدار، فروشنده، کاربر، بانک..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            icon={<FiSearch />} 
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices Table */}
        <Card>
          <div className="p-4 md:p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiDollarSign className="text-green-500" /> فاکتورها ({filteredInvoices.length})
            </h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                  <tr className="text-right">
                    <th className="p-2">شماره</th>
                    <th className="p-2">خریدار</th>
                    <th className="p-2">مبلغ</th>
                    <th className="p-2">کمیسیون</th>
                    <th className="p-2">وضعیت</th>
                    <th className="p-2">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">فاکتوری یافت نشد</td></tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition">
                        <td className="p-2 font-medium">{inv.invoice_number}</td>
                        <td className="p-2">{inv.buyer_name || '---'}</td>
                        <td className="p-2 font-medium text-blue-600">{formatPrice(inv.total)}</td>
                        <td className="p-2">{formatPrice(inv.platform_commission_amount)}</td>
                        <td className="p-2">
                          <Badge variant={invoiceColors[inv.status] || 'secondary'} size="sm">
                            {invoiceLabels[inv.status] || inv.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="xs" onClick={() => setSelectedInvoice(inv)} title="جزئیات">
                              <FiEye className="h-4 w-4" />
                            </Button>
                            {inv.status === 'issued' && inv.payment_receipt && !inv.payment_verified && (
                              <Button 
                                variant="ghost" 
                                size="xs" 
                                onClick={() => verifyPayment.mutate(inv.id)} 
                                isLoading={verifyPayment.isPending}
                                title="تایید پرداخت"
                              >
                                <FiCheck className="text-green-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                       </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Settlements Table */}
        <Card>
          <div className="p-4 md:p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FiDollarSign className="text-blue-500" /> تسویه‌ها ({filteredSettlements.length})
            </h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                  <tr className="text-right">
                    <th className="p-2">کاربر</th>
                    <th className="p-2">مبلغ</th>
                    <th className="p-2">بانک</th>
                    <th className="p-2">وضعیت</th>
                    <th className="p-2">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSettlements.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">تسویه‌ای یافت نشد</td></tr>
                  ) : (
                    filteredSettlements.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="p-2 font-medium">{s.user_name}</td>
                        <td className="p-2 font-medium text-blue-600">{formatPrice(s.amount)}</td>
                        <td className="p-2 text-xs">{s.bank_name || '---'}</td>
                        <td className="p-2">
                          <Badge variant={statusColors[s.status] || 'secondary'} size="sm">
                            {statusLabels[s.status] || s.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="xs" onClick={() => setSelectedSettlement(s)} title="جزئیات">
                              <FiEye className="h-4 w-4" />
                            </Button>
                            {s.status === 'pending' && (
                              <Button
                                variant="ghost" size="xs"
                                onClick={() => approveSettlement.mutate(s.id)}
                                isLoading={approveSettlement.isPending}
                                title="تایید تسویه"
                              >
                                <FiCheck className="text-green-500" />
                              </Button>
                            )}
                            {s.status === 'approved' && (
                              <Button
                                variant="ghost" size="xs"
                                onClick={() => markSettlementPaid.mutate(s.id)}
                                isLoading={markSettlementPaid.isPending}
                                title="پرداخت شد"
                              >
                                <FiDollarSign className="text-blue-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                       </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* Wallets Overview */}
      <Card>
        <div className="p-4 md:p-6">
          <h3 className="font-semibold mb-4">موجودی کیف پول کاربران ({wallets?.results?.length || 0})</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr className="text-right">
                  <th className="p-2">کاربر</th>
                  <th className="p-2">موجودی کل</th>
                  <th className="p-2">مسدود</th>
                  <th className="p-2">قابل برداشت</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {wallets?.results?.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">کیف پولی یافت نشد</td></tr>
                ) : (
                  wallets?.results?.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50 transition">
                      <td className="p-2">{w.user_name}</td>
                      <td className="p-2">{formatPrice(w.balance)}</td>
                      <td className="p-2 text-red-500">{formatPrice(w.frozen_balance)}</td>
                      <td className="p-2 font-medium text-green-600">{formatPrice(w.available_balance)}</td>
                     </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Pending Receipts */}
      <Card>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FiClock className="text-yellow-500" /> رسیدهای در انتظار تایید ({pendingReceipts.length})
            </h3>
          </div>
          {pendingReceipts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">📭 رسیدی در انتظار تایید نیست</p>
          ) : (
            <div className="space-y-4">
              {pendingReceipts.map((inv) => (
                <div key={inv.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <img
                      src={inv.payment_receipt}
                      alt="رسید"
                      className="h-16 w-16 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                      onClick={() => setPreviewImage(inv.payment_receipt)}
                    />
                    <div>
                      <p className="font-medium text-lg">{inv.invoice_number}</p>
                      <p className="text-sm text-gray-600">{inv.buyer_name} → {inv.seller_name}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{formatPrice(inv.total)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end md:self-center">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => verifyPayment.mutate(inv.id)}
                      isLoading={verifyPayment.isPending}
                    >
                      <FiCheck className="ml-1" /> تایید و واریز
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => rejectPayment.mutate(inv.id)}
                    >
                      <FiX className="ml-1" /> رد
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* All Invoices Table */}
      <Card>
        <div className="p-4 md:p-6">
          <h3 className="font-semibold mb-4">همه فاکتورها ({allInvoices.length})</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr className="text-right">
                  <th className="p-2">شماره</th>
                  <th className="p-2">خریدار</th>
                  <th className="p-2">فروشنده</th>
                  <th className="p-2">مبلغ</th>
                  <th className="p-2">کمیسیون</th>
                  <th className="p-2">وضعیت</th>
                  <th className="p-2">تایید</th>
                  <th className="p-2">رسید</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="p-2 font-medium">{inv.invoice_number}</td>
                    <td className="p-2">{inv.buyer_name}</td>
                    <td className="p-2">{inv.seller_name}</td>
                    <td className="p-2 font-medium text-blue-600">{formatPrice(inv.total)}</td>
                    <td className="p-2">{formatPrice(inv.platform_commission_amount)}</td>
                    <td className="p-2">
                      <Badge variant={invoiceColors[inv.status] || 'secondary'} size="sm">
                        {invoiceLabels[inv.status] || inv.status}
                      </Badge>
                      {inv.payment_verified && <Badge variant="success" size="sm" className="ml-1">تایید شده</Badge>}
                    </td>
                    <td className="p-2">
                      {inv.payment_receipt && !inv.payment_verified ? (
                        <Button variant="success" size="xs" onClick={() => verifyPayment.mutate(inv.id)} isLoading={verifyPayment.isPending}>
                          <FiCheck />
                        </Button>
                      ) : inv.payment_verified ? (
                        <FiCheck className="text-green-500" />
                      ) : (
                        <span className="text-xs text-gray-400">---</span>
                      )}
                    </td>
                    <td className="p-2">
                      {inv.payment_receipt ? (
                        <img src={inv.payment_receipt} alt="" className="h-8 w-8 object-cover rounded cursor-pointer border hover:opacity-80"
                          onClick={() => setPreviewImage(inv.payment_receipt)} />
                      ) : (
                        <span className="text-xs text-gray-400">---</span>
                      )}
                    </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`جزئیات فاکتور ${selectedInvoice.invoice_number}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
              <div><strong>شماره فاکتور:</strong> {selectedInvoice.invoice_number}</div>
              <div><strong>وضعیت:</strong> <Badge variant={invoiceColors[selectedInvoice.status]}>{invoiceLabels[selectedInvoice.status]}</Badge></div>
              <div><strong>خریدار:</strong> {selectedInvoice.buyer_name || '---'}</div>
              <div><strong>فروشنده:</strong> {selectedInvoice.seller_name || '---'}</div>
              <div><strong>مبلغ کل:</strong> <span className="font-bold text-blue-600">{formatPrice(selectedInvoice.total)}</span></div>
              <div><strong>کمیسیون:</strong> {formatPrice(selectedInvoice.platform_commission_amount)} ({selectedInvoice.platform_commission_rate}%)</div>
              <div><strong>پیش‌پرداخت:</strong> {formatPrice(selectedInvoice.advance_payment)}</div>
              <div><strong>باقی‌مانده:</strong> <span className="font-bold text-green-600">{formatPrice(selectedInvoice.remaining_amount)}</span></div>
              <div><strong>تاریخ صدور:</strong> {formatDate(selectedInvoice.issued_at || selectedInvoice.created_at)}</div>
              <div><strong>تاریخ پرداخت:</strong> {selectedInvoice.paid_at ? formatDate(selectedInvoice.paid_at) : '---'}</div>
            </div>
            {selectedInvoice.payment_receipt && (
              <div>
                <strong>رسید پرداخت:</strong>
                <img src={selectedInvoice.payment_receipt} alt="رسید" className="mt-2 max-h-48 rounded-lg border cursor-pointer" onClick={() => setPreviewImage(selectedInvoice.payment_receipt)} />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>بستن</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Settlement Detail Modal */}
      {selectedSettlement && (
        <Modal
          isOpen={!!selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
          title="جزئیات تسویه حساب"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
              <div><strong>کاربر:</strong> {selectedSettlement.user_name}</div>
              <div><strong>مبلغ:</strong> <span className="font-bold text-blue-600">{formatPrice(selectedSettlement.amount)}</span></div>
              <div><strong>بانک:</strong> {selectedSettlement.bank_name || '---'}</div>
              <div><strong>شماره حساب:</strong> <span className="font-mono">{selectedSettlement.bank_account_number || '---'}</span></div>
              <div><strong>شماره کارت:</strong> <span className="font-mono">{selectedSettlement.bank_card_number || '---'}</span></div>
              <div><strong>شبا:</strong> <span className="font-mono text-xs">{selectedSettlement.bank_shaba || '---'}</span></div>
              <div><strong>صاحب حساب:</strong> {selectedSettlement.bank_account_holder || '---'}</div>
              <div><strong>وضعیت:</strong> <Badge variant={statusColors[selectedSettlement.status]}>{statusLabels[selectedSettlement.status]}</Badge></div>
              <div><strong>تاریخ درخواست:</strong> {formatDate(selectedSettlement.created_at)}</div>
              <div><strong>تاریخ تایید:</strong> {selectedSettlement.approved_at ? formatDate(selectedSettlement.approved_at) : '---'}</div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              {selectedSettlement.status === 'pending' && (
                <Button variant="success" size="sm" onClick={() => { approveSettlement.mutate(selectedSettlement.id, { onSuccess: () => setSelectedSettlement(null) }) }}>
                  <FiCheck className="ml-1" /> تایید تسویه
                </Button>
              )}
              {selectedSettlement.status === 'approved' && (
                <Button variant="primary" size="sm" onClick={() => { markSettlementPaid.mutate(selectedSettlement.id, { onSuccess: () => setSelectedSettlement(null) }) }}>
                  <FiDollarSign className="ml-1" /> پرداخت شد
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedSettlement(null)}>بستن</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="رسید پرداخت" size="md">
          <img src={previewImage} alt="رسید" className="w-full rounded-lg" />
        </Modal>
      )}
    </div>
  )
}

// ========================
// Sub-component
// ========================
const StatCard = ({ icon: Icon, color, title, value }) => (
  <Card>
    <div className="p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </Card>
)