import { useState } from 'react'
import { ProductCard } from './ProductCard'
import { ProductFilters } from './ProductFilters'
import { Spinner, Alert } from '@components/ui'
import { useProducts } from '../hooks/useProducts'
import { useCartStore } from '@features/cart/store/cartStore'
import { FiGrid, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'

export const ProductList = () => {
  const [filters, setFilters] = useState({})
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const { data, isLoading, error } = useProducts(filters)
  const addToCart = useCartStore((state) => state.addItem)

  const products = data?.results || []
  const totalCount = data?.count || 0

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const handleAddToCart = (product) => {
    addToCart(product, 1)
    toast.success(`${product.name} به سبد خرید اضافه شد`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="error" title="خطا در دریافت محصولات">
        {error.userMessage || 'لطفاً دوباره تلاش کنید.'}
      </Alert>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <ProductFilters
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-secondary-600 dark:text-secondary-400">
              {totalCount} محصول یافت شد
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                <FiGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Products */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary-500 dark:text-secondary-400">
                محصولی با این مشخصات یافت نشد.
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data?.next || data?.previous ? (
            <div className="mt-8 flex justify-center">
              {/* Pagination component (omitted for brevity) */}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}