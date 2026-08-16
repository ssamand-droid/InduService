// frontend/src/features/dashboard/buyer/MyOrders.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEye } from 'react-icons/fi'
import { useOrders } from '@features/orders/hooks/useOrders'
import { formatPrice, formatDateSafe } from '@lib/utils'
import { ORDER_STATUS_LABELS } from '@lib/constants'

export default function MyOrders() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useOrders({ page: page })

  const orders = data?.results || []

  const getStatusClass = (status) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    if (status === 'confirmed') return 'bg-blue-100 text-blue-800'
    if (status === 'processing') return 'bg-purple-100 text-purple-800'
    if (status === 'shipped') return 'bg-indigo-100 text-indigo-800'
    if (status === 'delivered') return 'bg-green-100 text-green-800'
    if (status === 'completed') return 'bg-emerald-100 text-emerald-800'
    if (status === 'cancelled') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

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
      <h1 className="text-2xl font-bold text-gray-900">سفارش‌های من</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
          <p className="text-gray-500 mb-4">شما هنوز سفارشی ثبت نکرده‌اید.</p>
          <Link to="/products">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              مشاهده محصولات
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-right text-sm font-medium text-gray-500">
                  <th className="p-3">شماره سفارش</th>
                  <th className="p-3">تاریخ</th>
                  <th className="p-3">تعداد اقلام</th>
                  <th className="p-3">مبلغ کل</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{order.order_number}</td>
                    <td className="p-3 text-gray-600">{formatDateSafe(order.created_at)}</td>
                    <td className="p-3">{order.items_count}</td>
                    <td className="p-3 font-medium text-green-600">{formatPrice(order.total)}</td>
                    <td className="p-3">
                      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + getStatusClass(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link to={'/dashboard/orders/' + order.id}>
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1">
                          <FiEye size={16} />
                          <span>جزئیات</span>
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!data.previous}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200"
              >
                قبلی
              </button>
              <span className="text-sm text-gray-500">صفحه {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data.next}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200"
              >
                بعدی
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}