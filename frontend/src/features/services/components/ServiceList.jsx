import { useState } from 'react'
import { ServiceCard } from './ServiceCard'
import { ServiceFilters } from './ServiceFilters'
import { Spinner, Alert, Button } from '@components/ui'
import { useServices } from '../hooks/useServices'
import { FiFilter, FiX } from 'react-icons/fi'

// تابع امن فرمت عدد با هزارگان
const safeFormatNumber = (num) => {
  if (!num && num !== 0) return '۰'
  const n = Number(num)
  if (isNaN(n)) return '۰'
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
}

export const ServiceList = () => {
  const [filters, setFilters] = useState({})
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { data, isLoading, error } = useServices(filters)

  const services = data?.results || []
  const totalCount = data?.count || 0

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
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
      <div className="container-custom py-8 px-4">
        <Alert variant="error" title="خطا در دریافت خدمات">
          {error.userMessage || 'لطفاً دوباره تلاش کنید.'}
        </Alert>
      </div>
    )
  }

  return (
    <div className="container-custom py-4 sm:py-8 px-4 sm:px-6">
      {/* هدر */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">خدمات MRO</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {safeFormatNumber(totalCount)} خدمت یافت شد
        </p>
      </div>

      {/* دکمه فیلتر موبایل */}
      <div className="md:hidden mb-4">
        <Button 
          variant="outline" 
          fullWidth 
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center justify-center gap-2"
        >
          <FiFilter className="w-4 h-4" />
          فیلترها
          {Object.keys(filters).length > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {Object.keys(filters).length}
            </span>
          )}
        </Button>
      </div>

      {/* مدال فیلتر موبایل */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:hidden" onClick={() => setShowMobileFilters(false)}>
          <div 
            className="bg-white rounded-t-xl w-full max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">فیلترها</h3>
              <button 
                onClick={() => setShowMobileFilters(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ServiceFilters 
                filters={filters} 
                onChange={handleFilterChange} 
                onClear={() => {
                  handleClearFilters()
                  setShowMobileFilters(false)
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* چیدمان دسکتاپ */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* فیلترهای دسکتاپ */}
        <div className="hidden md:block md:w-64 lg:w-72 flex-shrink-0">
          <ServiceFilters 
            filters={filters} 
            onChange={handleFilterChange} 
            onClear={handleClearFilters} 
          />
        </div>

        {/* لیست خدمات */}
        <div className="flex-1">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                خدمتی با این مشخصات یافت نشد.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleClearFilters}
              >
                حذف فیلترها
              </Button>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-4 md:hidden">
                {safeFormatNumber(services.length)} نتیجه از {safeFormatNumber(totalCount)}
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
              
              {data?.next && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline">
                    بیشتر
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}