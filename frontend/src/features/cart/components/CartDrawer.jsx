import { Link } from 'react-router-dom'
import { FiX } from 'react-icons/fi'
import { useUIStore } from '@stores/uiStore'
import { useCart } from '../hooks/useCart'
import { Button } from '@components/ui'
import { formatPrice } from '@lib/utils'

export const CartDrawer = () => {
  const isCartOpen = useUIStore((state) => state.isCartOpen)
  const closeCart = useUIStore((state) => state.closeCart)
  const { items, removeItem, updateQuantity, totalPrice, isEmpty } = useCart()

  if (!isCartOpen) return null

  const handleClose = () => {
    console.log('Closing cart...')
    closeCart()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={handleClose}
      />
      <div className="fixed left-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-secondary-900 shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">سبد خرید</h3>
          <button onClick={handleClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isEmpty ? (
            <div className="text-center py-8">
              <p>سبد خرید خالی است</p>
              <Link to="/products" onClick={handleClose}>
                <Button variant="primary" className="mt-4">مشاهده محصولات</Button>
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex justify-between border-b py-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{formatPrice(item.price)} x {item.quantity}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm">حذف</button>
              </div>
            ))
          )}
        </div>
        {!isEmpty && (
          <div className="border-t p-4">
            <p className="text-lg font-bold mb-4">جمع کل: {formatPrice(totalPrice)}</p>
            <Link to="/checkout" onClick={handleClose}>
              <Button variant="primary" fullWidth size="lg">ادامه خرید</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}