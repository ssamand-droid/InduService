import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiMapPin, FiPhone, FiUser, FiCreditCard, FiCheck, FiCopy } from 'react-icons/fi'
import { useCart } from '@features/cart/hooks/useCart'
import { useCreateOrder } from '@features/orders/hooks/useOrders'
import { useAuthStore } from '@stores/authStore'
import { Card, Button, Alert, Badge } from '@components/ui'
import { FormInput, FormTextarea } from '@components/forms'
import { formatPrice } from '@lib/utils'
import toast from 'react-hot-toast'

const checkoutSchema = z.object({
  shipping_address: z.string().min(10, 'آدرس کامل را وارد کنید'),
  shipping_city: z.string().min(2, 'شهر را وارد کنید'),
  shipping_postal_code: z.string().min(10, 'کد پستی معتبر وارد کنید'),
  receiver_name: z.string().min(3, 'نام تحویل‌گیرنده را وارد کنید'),
  receiver_phone: z.string().min(10, 'شماره تماس معتبر وارد کنید'),
  buyer_note: z.string().optional(),
})

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, totalPrice, clearCart, isEmpty } = useCart()
  const { mutate: createOrder, isPending, error } = useCreateOrder()

  // state ها اینجا تعریف میشن - بالای همه چیز
  const [paymentStep, setPaymentStep] = useState('form')
  const [orderId, setOrderId] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      receiver_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
      receiver_phone: user?.phone_number || '',
      shipping_city: user?.profile?.city || '',
      shipping_postal_code: user?.profile?.postal_code || '',
      shipping_address: user?.profile?.address || '',
    },
  })

// src/pages/CheckoutPage.jsx - onSubmit

  const onSubmit = (data) => {
      if (isEmpty) return

      const ordersBySeller = {}
      items.forEach((item) => {
          const sellerId = item.seller_id
          if (!ordersBySeller[sellerId]) {
              ordersBySeller[sellerId] = { seller: sellerId, items: [] }
          }
          ordersBySeller[sellerId].items.push({
              product: item.id,
              quantity: item.quantity,
          })
      })

      const firstOrder = Object.values(ordersBySeller)[0]
      if (!firstOrder) return

      const orderData = { ...data, seller: firstOrder.seller, items: firstOrder.items }

      console.log('📦 Sending Order:', orderData)

      createOrder(orderData, {
          onSuccess: (response) => {
              clearCart()
              setOrderId(response.id || response.order_number)
              setPaymentStep('payment')
              toast.success('سفارش با موفقیت ثبت شد')
          },
          onError: (error) => {
              console.error('❌ Order Error:', error)
              toast.error(error.userMessage || 'خطا در ثبت سفارش')
          },
      })
  }

  // اگر سبد خرید خالی بود
  if (isEmpty && paymentStep === 'form') {
    return (
      <div className="container-custom py-8">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">سبد خرید شما خالی است</h2>
          <p className="text-secondary-600 mb-6">می‌توانید از بین محصولات متنوع ما خرید کنید.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/products')}>
            مشاهده محصولات
          </Button>
        </Card>
      </div>
    )
  }

  // صفحه پرداخت
  if (paymentStep === 'payment') {
    return (
      <div className="container-custom py-8">
        <div className="max-w-lg mx-auto">
          <Card className="text-center">
            <div className="p-8">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <FiCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">سفارش شما ثبت شد</h2>
              <p className="text-secondary-600 mb-2">
                شماره سفارش: <strong className="text-primary-600">{orderId}</strong>
              </p>
              <p className="text-secondary-500 text-sm mb-8">
                لطفاً برای پرداخت، یکی از روش‌های زیر را انتخاب کنید
              </p>

              <div className="space-y-3 mb-8">
                <Button variant="primary" fullWidth size="lg" className="bg-green-600 hover:bg-green-700">
                  <FiCreditCard className="ml-2" />
                  پرداخت مستقیم (درگاه بانکی)
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary-300 dark:border-secondary-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-secondary-800 px-4 text-secondary-500">یا</span>
                  </div>
                </div>

                <Button variant="outline" fullWidth size="lg">
                  پرداخت کارت به کارت
                </Button>
              </div>

              <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-xl text-right mb-6">
                <h4 className="font-medium mb-3 text-secondary-900 dark:text-white">اطلاعات حساب:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-500">شماره کارت:</span>
                    <span className="font-mono font-medium">۶۰۳۷-۹۹۱۸-۰۰۰۰-۱۲۳۴</span>
                    <button className="text-primary-600 hover:text-primary-700">
                      <FiCopy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">شماره حساب:</span>
                    <span className="font-mono">۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">شبا:</span>
                    <span className="font-mono text-xs">IR123456789012345678901234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">به نام:</span>
                    <span>شرکت خدمات صنعتی InduService</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-secondary-400 mb-6">
                پس از واریز، رسید پرداخت را در داشبورد خود آپلود کنید تا سفارش شما تایید شود.
              </p>

              <div className="flex gap-3">
                <Link to="/dashboard/orders" className="flex-1">
                  <Button variant="ghost" fullWidth>مشاهده سفارشات</Button>
                </Link>
                <Link to="/" className="flex-1">
                  <Button variant="primary" fullWidth>بازگشت به صفحه اصلی</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // فرم تسویه حساب
  return (
    <div className="container-custom py-8">
      <h1 className="heading-2 mb-8">تسویه حساب</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">اطلاعات ارسال</h3>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormInput
                    label="نام تحویل‌گیرنده"
                    name="receiver_name"
                    register={register}
                    error={errors.receiver_name}
                    icon={<FiUser className="h-5 w-5" />}
                  />
                  <FormInput
                    label="شماره تماس"
                    name="receiver_phone"
                    register={register}
                    error={errors.receiver_phone}
                    icon={<FiPhone className="h-5 w-5" />}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormInput
                    label="شهر"
                    name="shipping_city"
                    register={register}
                    error={errors.shipping_city}
                    icon={<FiMapPin className="h-5 w-5" />}
                  />
                  <FormInput
                    label="کد پستی"
                    name="shipping_postal_code"
                    register={register}
                    error={errors.shipping_postal_code}
                  />
                </div>

                <FormTextarea
                  label="آدرس کامل"
                  name="shipping_address"
                  register={register}
                  error={errors.shipping_address}
                  rows={3}
                />

                <FormTextarea
                  label="یادداشت (اختیاری)"
                  name="buyer_note"
                  register={register}
                  error={errors.buyer_note}
                  rows={2}
                />
              </form>

              {error && (
                <Alert variant="error" className="mt-4">
                  {error.userMessage || 'خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.'}
                </Alert>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">خلاصه سفارش</h3>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} <span className="text-secondary-500">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-600">جمع اقلام:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-primary-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                variant="primary"
                fullWidth
                size="lg"
                className="mt-6"
                isLoading={isPending}
                loadingText="در حال ثبت سفارش..."
              >
                <FiCreditCard className="ml-2" />
                ثبت سفارش و پرداخت
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}