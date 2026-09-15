import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiPackage, FiMapPin, FiPhone, FiUser, FiCheck, FiTruck, FiClock, } from 'react-icons/fi'
import { useOrder, useDeliverOrder, useConfirmOrder, useShipOrder } from '@features/orders/hooks/useOrders'
import { orderApi } from '@features/orders/services/orderApi'
import { useAuthStore } from '@stores/authStore'
import { OrderTimeline } from '@features/orders/components/OrderTimeline'
import { MROWorkflowSteps } from '@features/orders/components/MROWorkflowSteps'
import { ReceiptUploader } from '@features/orders/components/ReceiptUploader'
import { Spinner, Alert, Button, Card, CardHeader, CardTitle, CardContent, Badge, ConfirmModal } from '@components/ui'
import { formatPrice, formatDate } from '@lib/utils'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@lib/constants'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: order, isLoading, error, refetch } = useOrder(id)

  const { mutate: confirmOrder, isPending: isConfirming } = useConfirmOrder()
  const { mutate: shipOrder, isPending: isShipping } = useShipOrder()
  const { mutate: deliverOrder, isPending: isDelivering } = useDeliverOrder()

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null })

  const isSeller = user?.role === 'seller' || user?.role === 'service_provider'
  const isBuyer = user?.role === 'buyer'
  const canManage = isSeller && order?.seller === user?.id

  const handleAction = (action) => {
    setConfirmModal({ isOpen: true, action })
  }

  const executeAction = () => {
    const action = confirmModal.action
    if (!order) return

    const onSuccess = () => {
      setConfirmModal({ isOpen: false, action: null })
      refetch()
    }

    switch (action) {
      case 'confirm':
        confirmOrder(order.id, { onSuccess })
        break
      case 'ship':
        shipOrder(order.id, { onSuccess })
        break
      case 'deliver':
        deliverOrder(order.id, { onSuccess })
        break
    }
  }

  if (isLoading) return <div className="container-custom py-8"><Spinner size="lg" /></div>
  if (error) return <Alert variant="error">خطا در دریافت اطلاعات سفارش</Alert>
  if (!order) return <Alert variant="warning">سفارش یافت نشد</Alert>

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary-100">
            <FiArrowRight className="h-5 w-5" />
          </button>
          <h1 className="heading-2">جزئیات سفارش {order.order_number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={
            order.status === 'completed' ? 'success' :
            order.status === 'cancelled' ? 'danger' : 'warning'
          }>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <Badge variant={
            order.payment_status === 'paid' ? 'success' :
            order.payment_status === 'partial' ? 'warning' : 'warning'
          }>
            {order.payment_status === 'paid' ? 'پرداخت شده' :
             order.payment_status === 'partial' ? 'پرداخت جزئی' : 'پرداخت نشده'}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardContent>
              <OrderTimeline currentStatus={order.status} />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>اقلام سفارش</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0 border-secondary-200 dark:border-secondary-700">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-secondary-100 dark:bg-secondary-700 overflow-hidden">
                      {item.product_details?.primary_image ? (
                        <img src={item.product_details.primary_image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900 dark:text-white">{item.product_details?.name}</h4>
                      <p className="text-sm text-secondary-500">کد: {item.product_details?.sku}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{formatPrice(item.unit_price)}</p>
                      <p className="text-sm text-secondary-500">تعداد: {item.quantity}</p>
                    </div>
                    <div className="text-left min-w-24">
                      <p className="font-medium text-primary-600">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">جمع اقلام:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-secondary-600 dark:text-secondary-400">هزینه ارسال:</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-secondary-600 dark:text-secondary-400">مالیات:</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm mt-2 text-green-600">
                    <span>تخفیف:</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <span>مبلغ نهایی:</span>
                  <span className="text-primary-600">{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* آپلود رسید پرداخت (برای خریدار) */}
          {isBuyer && order.payment_status === 'unpaid' && (
            <Card>
              <CardHeader>
                <CardTitle>ثبت رسید پرداخت</CardTitle>
              </CardHeader>
              <CardContent>
                {order.payment_receipt ? (
                  <div className="text-center">
                    <Badge variant="success" className="mb-3">✅ رسید ثبت شد - در انتظار تایید</Badge>
                    <img src={order.payment_receipt} alt="رسید پرداخت" className="max-h-48 mx-auto rounded-lg shadow-md" />
                  </div>
                ) : (
                  <ReceiptUploader orderId={order.id} onSuccess={() => refetch()} />
                )}
              </CardContent>
            </Card>
          )}

          {/* MRO Workflow Steps (اگر سرویس باشد) */}
          {order.mro_steps !== undefined && order.mro_steps?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>مراحل اجرایی</CardTitle>
              </CardHeader>
              <CardContent>
                <MROWorkflowSteps
                  steps={order.mro_steps}
                  isSeller={canManage}
                  isBuyer={isBuyer}
                  onUpdateStep={async (stepId, data) => {
                    await orderApi.updateMROStep(order.id, stepId, data)
                    refetch()
                  }}
                  onAddStep={async (data) => {
                    await orderApi.addMROStep(order.id, data)
                    refetch()
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Actions */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>عملیات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.status === ORDER_STATUS.PENDING && (
                  <Button variant="primary" fullWidth onClick={() => handleAction('confirm')} isLoading={isConfirming}>
                    <FiCheck className="ml-2" /> تایید سفارش
                  </Button>
                )}
                {order.status === ORDER_STATUS.CONFIRMED && (
                  <Button variant="info" fullWidth onClick={() => handleAction('ship')} isLoading={isShipping}>
                    <FiTruck className="ml-2" /> ثبت ارسال
                  </Button>
                )}
                <Button variant="outline" fullWidth onClick={() => navigate('/dashboard/manage-orders')}>
                  بازگشت به لیست
                </Button>
              </CardContent>
            </Card>
          )}

          {isBuyer && order.status === ORDER_STATUS.SHIPPED && (
            <Card>
              <CardContent>
                <Button variant="success" fullWidth onClick={() => handleAction('deliver')} isLoading={isDelivering}>
                  <FiCheck className="ml-2" /> تایید دریافت سفارش
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>وضعیت پرداخت</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {order.payment_status === 'paid' ? (
                  <div className="text-green-600">
                    <FiCheck className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-bold text-lg">پرداخت شده</p>
                    <p className="text-sm text-secondary-500 mt-1">پرداخت تایید شد</p>
                  </div>
                ) : order.payment_status === 'unpaid' ? (
                  <div className="text-yellow-600">
                    <FiClock className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-bold text-lg">در انتظار پرداخت</p>
                  </div>
                ) : (
                  <div className="text-blue-600">
                    <FiClock className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-bold text-lg">در حال بررسی</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات ارسال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <FiUser className="h-5 w-5 text-secondary-400 mt-0.5" />
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">{order.receiver_name}</p>
                  <p className="text-sm text-secondary-500">{order.receiver_phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMapPin className="h-5 w-5 text-secondary-400 mt-0.5" />
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">{order.shipping_address}</p>
                  <p className="text-sm text-secondary-500">{order.shipping_city} - کد پستی: {order.shipping_postal_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500">تاریخ ثبت:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-secondary-500">تاریخ تایید:</span>
                  <span>{formatDate(order.confirmed_at)}</span>
                </div>
              )}
              {order.shipped_at && (
                <div className="flex justify-between">
                  <span className="text-secondary-500">تاریخ ارسال:</span>
                  <span>{formatDate(order.shipped_at)}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-secondary-500">تاریخ تحویل:</span>
                  <span>{formatDate(order.delivered_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller/Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle>{isBuyer ? 'اطلاعات فروشنده' : 'اطلاعات خریدار'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isBuyer ? (
                <div className="flex items-center gap-3">
                  <FiPackage className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-white">{order.seller_name}</p>
                    <p className="text-sm text-secondary-500">{order.seller_email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <FiUser className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-white">{order.buyer_name}</p>
                    <p className="text-sm text-secondary-500">{order.buyer_email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null })}
        onConfirm={executeAction}
        title={
          confirmModal.action === 'confirm' ? 'تایید سفارش' :
          confirmModal.action === 'ship' ? 'ثبت ارسال' : 'تایید تحویل'
        }
        message={
          confirmModal.action === 'confirm' ? 'آیا از تایید این سفارش اطمینان دارید؟' :
          confirmModal.action === 'ship' ? 'آیا سفارش آماده ارسال است؟' :
          'آیا سفارش را دریافت کرده‌اید؟'
        }
        variant="primary"
        isLoading={confirmModal.action === 'confirm' ? isConfirming :
                   confirmModal.action === 'ship' ? isShipping : isDelivering}
      />
    </div>
  )
}