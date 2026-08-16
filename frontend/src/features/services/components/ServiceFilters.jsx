import { useState } from 'react'
import { FiChevronDown, FiX } from 'react-icons/fi'
import { useServiceCategories } from '../hooks/useServices'
import { SERVICE_SCENARIOS } from '@lib/constants'
import { cn } from '@lib/utils'

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200 py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between text-sm font-medium">
        {title}
        <FiChevronDown className={cn('h-5 w-5 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

export const ServiceFilters = ({ filters, onChange, onClear }) => {
  const { data: categoriesData } = useServiceCategories()
  const categories = categoriesData?.results || []
  
  // تبدیل filters به state محلی برای چک‌باکس‌ها
  const [selectedCategories, setSelectedCategories] = useState(filters?.categories || [])
  const [selectedScenario, setSelectedScenario] = useState(filters?.service_scenario || '')

  const handleCategoryChange = (categoryId, checked) => {
    const newSelected = checked 
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter(id => id !== categoryId)
    setSelectedCategories(newSelected)
    onChange?.({ ...filters, categories: newSelected })
  }

  const handleScenarioChange = (value) => {
    setSelectedScenario(value)
    onChange?.({ ...filters, service_scenario: value || undefined })
  }

  const handleClearAll = () => {
    setSelectedCategories([])
    setSelectedScenario('')
    onClear?.()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">فیلترها</h3>
        <button onClick={handleClearAll} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
          <FiX className="h-4 w-4" /> حذف همه
        </button>
      </div>

      <FilterSection title="دسته‌بندی">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">در حال بارگذاری...</p>
        ) : (
          categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(cat.id)}
                onChange={(e) => handleCategoryChange(cat.id, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </label>
          ))
        )}
      </FilterSection>

      <FilterSection title="سناریوی خدمت">
        <select 
          value={selectedScenario}
          onChange={(e) => handleScenarioChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">همه سناریوها</option>
          {Object.entries(SERVICE_SCENARIOS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </FilterSection>
    </div>
  )
}