// src/features/products/components/ProductList.jsx
import { useState } from 'react'
import { ProductCard } from './ProductCard'
import { ProductFilters } from './ProductFilters'
import { Spinner, Alert } from '@components/ui'
import { useProducts } from '../hooks/useProducts'
import { useCartStore } from '@features/cart/store/cartStore'
import { FiGrid, FiList, FiFilter, FiX } from 'react-icons/fi'
import { useMediaQuery } from '@hooks/useMediaQuery'
import toast from 'react-hot-toast'

export const ProductList = () => {
  const [filters, setFilters] = useState({})
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { data, isLoading, error } = useProducts(filters)
  const addToCart = useCartStore((state) => state.addItem)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const products = data?.results || []
  const totalCount = data?.count || 0
  const hasActiveFilters = Object.keys(filters).length > 0

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    if (isMobile) {
      setShowMobileFilters(false)
    }
  }

  const handleClearFilters = () => {
    setFilters({})
    if (isMobile) {
      setShowMobileFilters(false)
    }
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
        {/* ===== Filters Sidebar (Desktop) ===== */}
        <div className="hidden lg:block lg:w-72 flex-shrink-0">
          <ProductFilters
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* ===== Mobile Filter Drawer ===== */}
        {isMobile && (
          <>
            {/* Overlay */}
            {showMobileFilters && (
              <div 
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowMobileFilters(false)}
              />
            )}
            
            {/* Drawer */}
            <div className={`
              fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 z-50 
              transition-transform duration-300 ease-in-out shadow-xl
              ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}
            `}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-bold text-lg">فیلتر محصولات</h3>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
                <ProductFilters
                  filters={filters}
                  onChange={handleFilterChange}
                  onClear={handleClearFilters}
                  isMobile={true}
                />
              </div>
            </div>
          </>
        )}

        {/* ===== Products Section ===== */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <p className="text-secondary-600 dark:text-secondary-400">
              {totalCount} محصول یافت شد
              {hasActiveFilters && (
                <button 
                  onClick={handleClearFilters}
                  className="mr-2 text-sm text-red-500 hover:text-red-600"
                >
                  (حذف فیلترها)
                </button>
              )}
            </p>
            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-lg"
                >
                  <FiFilter className="h-4 w-4" />
                  <span className="text-sm">فیلتر</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-primary-600 rounded-full" />
                  )}
                </button>
              )}

              {/* View Mode Toggle */}
              <div className="flex bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-secondary-700 shadow-sm text-primary-600 dark:text-primary-400'
                      : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                  }`}
                  title="نمایش شبکه‌ای"
                >
                  <FiGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-secondary-700 shadow-sm text-primary-600 dark:text-primary-400'
                      : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                  }`}
                  title="نمایش لیستی"
                >
                  <FiList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
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
                  viewMode={viewMode}
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