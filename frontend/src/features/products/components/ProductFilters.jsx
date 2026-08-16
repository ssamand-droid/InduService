import { useState, useEffect } from 'react'
import { FiChevronDown, FiX } from 'react-icons/fi'
import { Button, Input } from '@components/ui'
import { useCategories, useBrands } from '../hooks/useProducts'
import { PRODUCT_TYPES, PRODUCT_CONDITIONS } from '@lib/constants'
import { cn } from '@lib/utils'

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-secondary-200 dark:border-secondary-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-medium text-secondary-900 dark:text-white"
      >
        {title}
        <FiChevronDown
          className={cn(
            'h-5 w-5 text-secondary-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

export const ProductFilters = ({ filters, onChange, onClear }) => {
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleChange = (key, value) => {
    const updated = { ...localFilters, [key]: value }
    setLocalFilters(updated)
    onChange?.(updated)
  }

  const handlePriceChange = (min, max) => {
    handleChange('min_price', min)
    handleChange('max_price', max)
  }

  const categories = categoriesData?.results || []
  const brands = brandsData?.results || []

  const activeFilterCount = Object.values(filters).filter(v => v).length

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-secondary-900 dark:text-white">فیلترها</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <FiX className="h-4 w-4" />
            حذف همه
          </button>
        )}
      </div>

      <FilterSection title="دسته‌بندی">
        {categories.map((cat) => (
          <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.category === cat.slug}
              onChange={() => handleChange('category', localFilters.category === cat.slug ? '' : cat.slug)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-700 dark:text-secondary-300">{cat.name}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="برند">
        <div className="max-h-48 overflow-y-auto space-y-2">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.brand === brand.slug}
                onChange={() => handleChange('brand', localFilters.brand === brand.slug ? '' : brand.slug)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">{brand.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="محدوده قیمت (ریال)">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="حداقل"
            value={localFilters.min_price || ''}
            onChange={(e) => handlePriceChange(e.target.value, localFilters.max_price)}
          />
          <Input
            type="number"
            placeholder="حداکثر"
            value={localFilters.max_price || ''}
            onChange={(e) => handlePriceChange(localFilters.min_price, e.target.value)}
          />
        </div>
      </FilterSection>

      <FilterSection title="نوع محصول">
        {Object.entries(PRODUCT_TYPES).map(([key, value]) => (
          <label key={value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.product_type === value}
              onChange={() => handleChange('product_type', localFilters.product_type === value ? '' : value)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-700 dark:text-secondary-300">
              {key === 'PART' ? 'قطعه یدکی' : key === 'KIT' ? 'کیت' : key === 'RAW' ? 'مواد اولیه' : 'ابزار'}
            </span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="وضعیت">
        {Object.entries(PRODUCT_CONDITIONS).map(([key, value]) => (
          <label key={value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.condition === value}
              onChange={() => handleChange('condition', localFilters.condition === value ? '' : value)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-700 dark:text-secondary-300">
              {value === 'new' ? 'نو' : value === 'refurbished' ? 'بازسازی شده' : 'کارکرده'}
            </span>
          </label>
        ))}
      </FilterSection>
    </div>
  )
}