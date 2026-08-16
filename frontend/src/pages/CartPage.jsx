import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiShoppingBag, FiAlertCircle } from 'react-icons/fi'
import { useCartStore } from '@features/cart/store/cartStore'
import { Button, Card, Badge } from '@components/ui'
import { formatPrice } from '@lib/utils'

export default function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)

  const totalPrice = getTotalPrice()
  const isEmpty = items.length === 0

  if (isEmpty) {
    return (
      <div className="container-custom py-8">
        <Card className="text-center py-16">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
            سبد خرید شما خالی است
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-8">
            هنوز محصولی به سبد خرید اضافه نکرده‌اید.
          </p>
          <Link to="/products">
            <Button variant="primary" size="lg">
              <FiShoppingBag className="ml-2" /> مشاهده محصولات
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="heading-2">سبد خرید</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
          <FiTrash2 className="h-4 w-4" /> حذف همه
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex gap-4 p-4">
                <Link to={`/products/${item.slug}`} className="h-28 w-28 flex-shrink-0 rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-700">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.slug}`} className="font-medium text-secondary-900 dark:text-white hover:text-primary-600 line-clamp-2">
                    {item.name}
                  </Link>
                  {item.category_name && (
                    <Badge variant="secondary" size="sm" className="mt-1">{item.category_name}</Badge>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-secondary-300 dark:border-secondary-600 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition">
                        <FiMinus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition">
                        <FiPlus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <button onClick={() => removeItem(item.id)}
                        className="p-2 text-secondary-400 hover:text-red-500 transition">
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6 pb-4 border-b border-secondary-200 dark:border-secondary-700">
                خلاصه سفارش
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">تعداد اقلام</span>
                  <span className="font-medium">{items.reduce((t, i) => t + i.quantity, 0)} عدد</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">جمع کل</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex justify-between text-lg font-bold">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="text-primary-600 dark:text-primary-400">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="mt-6"
                onClick={() => navigate('/checkout')}
              >
                ادامه فرآیند خرید
              </Button>

              <Button
                variant="ghost"
                fullWidth
                className="mt-3"
                onClick={() => navigate('/products')}
              >
                <FiArrowLeft className="ml-2" /> ادامه خرید
              </Button>

              <div className="mt-6 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg text-xs text-secondary-500 flex items-start gap-2">
                <FiAlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>با ثبت سفارش، شرایط و قوانین InduService را می‌پذیرید.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}