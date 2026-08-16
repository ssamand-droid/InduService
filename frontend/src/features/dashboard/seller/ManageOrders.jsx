// frontend/src/features/dashboard/seller/ManageOrders.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiTruck, FiEye } from 'react-icons/fi'
import { useOrders, useConfirmOrder, useShipOrder } from '@features/orders/hooks/useOrders'
import { formatPrice, formatDateSafe } from '@lib/utils'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@lib/constants'

export default function ManageOrders() {
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, order: null })
  const [shipModal, setShipModal] = useState({ isOpen: false, order: null })

  const { data, isLoading, error } = useOrders()
  const { mutate: confirmOrder, isPending: isConfirming } = useConfirmOrder()
  const { mutate: shipOrder, isPending: isShipping } = useShipOrder()

  const orders = data?.results || []

  const handleConfirm = () => {
    if (confirmModal.order) {
      confirmOrder(confirmModal.order.id, {
        onSuccess: () => setConfirmModal({ isOpen: false, order: null })
      })
    }
  }

  const handleShip = () => {
    if (shipModal.order) {
      shipOrder(shipModal.order.id, {
        onSuccess: () => setShipModal({ isOpen: false, order: null })
      })
    }
  }

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
      <h1 className="text-2xl font-bold text-gray-900">مدیریت سفارشات</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
          <p className="text-gray-500">هنوز سفارشی دریافت نکرده‌اید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-900">{order.order_number}</h3>
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + getStatusClass(order.status)}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">خریدار: <span className="text-gray-900 font-medium">{order.buyer_name}</span></p>
                      <p className="text-gray-500">تاریخ ثبت: {formatDateSafe(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">تعداد اقلام: {order.items_count}</p>
                      <p className="text-gray-500">مبلغ: <span className="font-medium text-green-600">{formatPrice(order.total)}</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={'/dashboard/manage-orders/' + order.id}>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1">
                      <FiEye size={16} />
                      <span>جزئیات</span>
                    </button>
                  </Link>

                  {order.status === ORDER_STATUS.PENDING && (
                    <button
                      onClick={() => setConfirmModal({ isOpen: true, order: order })}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      <FiCheck size={16} />
                      <span>تایید</span>
                    </button>
                  )}

                  {order.status === ORDER_STATUS.CONFIRMED && (
                    <button
                      onClick={() => setShipModal({ isOpen: true, order: order })}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      <FiTruck size={16} />
                      <span>ارسال</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal تایید سفارش */}
      {confirmModal.isOpen && confirmModal.order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">تایید سفارش</h3>
            <p className="text-gray-600 mb-6">
              آیا سفارش "{confirmModal.order.order_number}" تایید می‌شود؟
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, order: null })}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isConfirming ? 'در حال...' : 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ثبت ارسال */}
      {shipModal.isOpen && shipModal.order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">ثبت ارسال</h3>
            <p className="text-gray-600 mb-6">
              آیا سفارش "{shipModal.order.order_number}" آماده ارسال است؟
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShipModal({ isOpen: false, order: null })}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                انصراف
              </button>
              <button
                onClick={handleShip}
                disabled={isShipping}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isShipping ? 'در حال...' : 'ثبت ارسال'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}