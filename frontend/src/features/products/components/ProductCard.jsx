import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingCart, FiStar, FiMinus, FiPlus, FiEye } from 'react-icons/fi'
import { Card, Button, Badge } from '@components/ui'
import { formatPrice, truncateText } from '@lib/utils'
import { PRODUCT_CONDITIONS } from '@lib/constants'
import { cn } from '@lib/utils'

const conditionLabels = {
  [PRODUCT_CONDITIONS.NEW]: 'نو',
  [PRODUCT_CONDITIONS.REFURBISHED]: 'بازسازی شده',
  [PRODUCT_CONDITIONS.USED]: 'کارکرده',
}

export const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQty] = useState(1)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const {
    slug, name, short_description, final_price, price, discount_price,
    primary_image, condition, is_in_stock, average_rating = 0, stock_quantity,
  } = product

  const hasDiscount = discount_price && discount_price < price
  const discountPercent = hasDiscount ? Math.round(((price - discount_price) / price) * 100) : 0

  return (
    <Card hoverable className="h-full flex flex-col group overflow-hidden">
      <Link to={`/products/${slug}`} className="block relative">
        <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-700">
          {primary_image && !imageError ? (
            <>
              <img
                src={primary_image}
                alt={name}
                className={cn(
                  'h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
          )}

          {!is_in_stock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium text-lg">ناموجود</span>
            </div>
          )}

          {hasDiscount && (
            <Badge variant="danger" className="absolute top-2 left-2 text-xs">
              {discountPercent}٪
            </Badge>
          )}

          <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
            {conditionLabels[condition] || condition}
          </Badge>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-white dark:bg-secondary-800 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-1">
              <FiEye className="h-4 w-4" /> مشاهده
            </span>
          </div>
        </div>
      </Link>

      <div className="flex-1 mt-4 px-1">
        <Link to={`/products/${slug}`}>
          <h3 className="font-medium text-secondary-900 dark:text-white line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[3rem]">
            {name}
          </h3>
        </Link>
        {short_description && (
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400 line-clamp-2">
            {truncateText(short_description, 80)}
          </p>
        )}

        <div className="mt-2 flex items-center gap-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.round(average_rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-secondary-300 dark:text-secondary-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-secondary-500">({average_rating || 0})</span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            {hasDiscount && (
              <span className="text-xs text-secondary-400 line-through ml-1">
                {formatPrice(price)}
              </span>
            )}
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(final_price)}
            </span>
          </div>
          {is_in_stock && (
            <Badge variant="success" size="sm" className="text-xs">
              {stock_quantity} عدد
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {is_in_stock && (
          <div className="flex items-center justify-center gap-1 bg-secondary-50 dark:bg-secondary-800 rounded-lg p-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded flex items-center justify-center hover:bg-white dark:hover:bg-secondary-700 transition"
              disabled={quantity <= 1}
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-medium text-sm">{quantity}</span>
            <button
              onClick={() => setQty((q) => Math.min(stock_quantity || 99, q + 1))}
              className="w-8 h-8 rounded flex items-center justify-center hover:bg-white dark:hover:bg-secondary-700 transition"
              disabled={quantity >= (stock_quantity || 99)}
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <Button
          variant="primary"
          fullWidth
          size="sm"
          disabled={!is_in_stock}
          onClick={() => onAddToCart?.(product, quantity)}
        >
          <FiShoppingCart className="ml-2 h-4 w-4" />
          {is_in_stock ? 'افزودن به سبد خرید' : 'ناموجود'}
        </Button>
      </div>
    </Card>
  )
}