// frontend/src/pages/AdminOrdersPage.jsx - نسخه اصلاح شده کامل
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiEye, FiCheck, FiX } from 'react-icons/fi'
import api from '@lib/axios'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '@lib/utils'
import { ORDER_STATUS_LABELS } from '@lib/constants'

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      return api.get(`/api/orders/orders/${params}`).then(res => res.data)
    },
  })

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/api/orders/orders/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('بروزرسانی شد')
    },
  })

  const orders = data?.results || []

  const paymentLabels = { unpaid: 'پرداخت نشده', partial: 'پرداخت جزئی', paid: 'پرداخت شده', refunded: 'بازپرداخت' }

  const getPaymentClass = (status) => {
    const classes = { unpaid: 'bg-red-100 text-red-800', partial: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800' }
    return classes[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusClass = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredOrders = orders.filter(o =>
    (o.order_number?.toLowerCase().includes(search.toLowerCase())) ||
    (o.buyer_name?.toLowerCase().includes(search.toLowerCase())) ||
    (o.seller_name?.toLowerCase().includes(search.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">در حال بارگذاری...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          خطا در دریافت سفارشات
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">مدیریت سفارشات</h1>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          {data?.count || 0} سفارش
        </span>
      </div>

      {/* فیلترها */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="جستجوی شماره سفارش، خریدار، فروشنده..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول سفارشات */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-right text-sm font-medium text-gray-500">
                <th className="p-3">شماره</th>
                <th className="p-3">خریدار</th>
                <th className="p-3">فروشنده</th>
                <th className="p-3">مبلغ</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">پرداخت</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    سفارشی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{order.order_number}</td>
                    <td className="p-3">
                      <div>{order.buyer_name}</div>
                      <div className="text-xs text-gray-500">{order.buyer_phone}</div>
                    </td>
                    <td className="p-3">
                      <div>{order.seller_name}</div>
                      <div className="text-xs text-gray-500">{order.seller_phone}</div>
                    </td>
                    <td className="p-3 font-medium text-green-600">{formatPrice(order.total)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${getPaymentClass(order.payment_status)}`}>
                        {paymentLabels[order.payment_status]}
                      </span>
                    </td>
                    {/* <td className="p-3 text-gray-500 text-sm">{formatDate(order.created_at)}</td> */}
                    <td className="p-3 text-gray-500 text-sm">
                      {order.created_at}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-800"
                          title="مشاهده جزئیات"
                        >
                          <FiEye size={18} />
                        </button>
                        {!order.payment_verified && (
                          <button
                            onClick={() => updateOrderMutation.mutate({ id: order.id, data: { payment_status: 'paid', payment_verified: true } })}
                            className="text-green-600 hover:text-green-800"
                            title="تایید پرداخت"
                          >
                            <FiCheck size={18} />
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'completed' && (
                          <button
                            onClick={() => {
                              if (window.confirm('آیا از لغو این سفارش اطمینان دارید؟')) {
                                updateOrderMutation.mutate({ id: order.id, data: { status: 'cancelled' } })
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="لغو سفارش"
                          >
                            <FiX size={18} />
                          </button>
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

      {/* Modal جزئیات سفارش */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">جزئیات سفارش {selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>خریدار:</strong> {selectedOrder.buyer_name} ({selectedOrder.buyer_phone})</div>
                <div><strong>فروشنده:</strong> {selectedOrder.seller_name} ({selectedOrder.seller_phone})</div>
                <div><strong>مبلغ کل:</strong> <span className="text-green-600 font-bold">{formatPrice(selectedOrder.total)}</span></div>
                <div><strong>وضعیت:</strong> <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(selectedOrder.status)}`}>{ORDER_STATUS_LABELS[selectedOrder.status]}</span></div>
                <div><strong>پرداخت:</strong> <span className={`px-2 py-0.5 rounded text-xs ${getPaymentClass(selectedOrder.payment_status)}`}>{paymentLabels[selectedOrder.payment_status]}</span></div>
                <div><strong>تاریخ ثبت:</strong> {formatDate(selectedOrder.created_at)}</div>
              </div>
              <hr />
              <div><strong>آدرس ارسال:</strong> {selectedOrder.shipping_address}</div>
              <div><strong>شهر:</strong> {selectedOrder.shipping_city}</div>
              <div><strong>کد پستی:</strong> {selectedOrder.shipping_postal_code}</div>
              <div><strong>گیرنده:</strong> {selectedOrder.receiver_name} - {selectedOrder.receiver_phone}</div>
              {selectedOrder.buyer_note && <div><strong>یادداشت خریدار:</strong> {selectedOrder.buyer_note}</div>}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}