import { Link } from 'react-router-dom'
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi'
import { formatPrice } from '@lib/utils'

export const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <div className="flex gap-4 py-4">
      <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-secondary-100 dark:bg-secondary-700 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
        )}
      </div>

      <div className="flex-1">
        <Link to={`/products/${item.slug}`} className="font-medium hover:text-primary-600">
          {item.name}
        </Link>
        <p className="text-primary-600 text-sm">{formatPrice(item.price)}</p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button onClick={onRemove} className="text-red-500 hover:text-red-700">
          <FiTrash2 className="h-4 w-4" />
        </button>

        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="p-1.5 hover:bg-secondary-100 disabled:opacity-50"
            disabled={item.quantity <= 1}
          >
            <FiMinus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="p-1.5 hover:bg-secondary-100"
          >
            <FiPlus className="h-3 w-3" />
          </button>
        </div>

        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
      </div>
    </div>
  )
}