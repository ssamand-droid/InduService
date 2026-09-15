// frontend/src/features/services/components/ServiceRequestFilters.jsx
import { useState, useEffect } from 'react'
import { FiChevronDown, FiFilter, FiX } from 'react-icons/fi'
import { Button } from '@components/ui'

const FilterSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-secondary-200 dark:border-secondary-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-medium text-secondary-900 dark:text-white"
      >
        {title}
        <FiChevronDown
          className={`h-5 w-5 text-secondary-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

// نوع‌های خدمت (بر اساس پروژه شما)
const SERVICE_TYPES = {
  'parts_manufacturing': 'ساخت قطعه',
  'rewinding': 'سیم‌پیچی',
  'laser_welding': 'جوشکاری لیزر',
  'argon_welding': 'جوشکاری آرگون',
  'tig_welding': 'جوشکاری تیگ',
  'arc_welding': 'جوشکاری برق',
  'machining': 'ماشین‌کاری',
  'oil_analysis': 'آنالیز روغن',
  'calibration': 'کالیبراسیون',
  'ndt': 'آزمون‌های غیرمخرب',
  'installation': 'نصب',
  'repair': 'تعمیر',
  'maintenance': 'نگهداری',
  'consulting': 'مشاوره',
}

// سناریوهای خدمت (از پروژه شما)
const SERVICE_SCENARIOS = {
  'rewinding': 'سیم‌پیچی',
  'machining': 'ماشین‌کاری',
  'oil_analysis': 'آنالیز روغن',
  'calibration': 'کالیبراسیون',
  'ndt': 'آزمون‌های غیرمخرب',
  'parts_manufacturing': 'ساخت قطعه',
  'welding': 'جوشکاری',
}

// وضعیت‌های درخواست
const STATUS_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'pending', label: 'در انتظار بررسی' },
  { value: 'reviewed', label: 'بررسی شده' },
  { value: 'quoted', label: 'قیمت داده شده' },
  { value: 'accepted', label: 'پذیرفته شده' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'rejected', label: 'رد شده' },
  { value: 'cancelled', label: 'لغو شده' },
]

export const ServiceRequestFilters = ({ filters, onChange, onClear }) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleChange = (key, value) => {
    const updated = { ...localFilters, [key]: value }
    setLocalFilters(updated)
    onChange?.(updated)
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length

  return (
    <>
      {/* دکمه باز کردن فیلتر در موبایل */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="w-full flex items-center justify-center gap-2"
        >
          <FiFilter className="h-4 w-4" />
          {isMobileFilterOpen ? 'بستن فیلترها' : 'باز کردن فیلترها'}
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* پنل فیلتر */}
      <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} lg:block bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 p-4 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-900 dark:text-white">فیلترها</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                onClear?.()
                setLocalFilters({})
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              <FiX className="h-4 w-4" />
              حذف همه
            </button>
          )}
        </div>

        {/* فیلتر وضعیت */}
        <FilterSection title="وضعیت درخواست" defaultOpen={true}>
          <select
            value={localFilters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-secondary-700"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FilterSection>

        {/* فیلتر نوع خدمت */}
        <FilterSection title="نوع خدمت">
          <div className="max-h-48 overflow-y-auto space-y-2">
            {Object.entries(SERVICE_TYPES).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.service_type === key}
                  onChange={() => handleChange('service_type', localFilters.service_type === key ? '' : key)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">{label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* فیلتر سناریو خدمت */}
        <FilterSection title="سناریو خدمت">
          <div className="space-y-2">
            {Object.entries(SERVICE_SCENARIOS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.scenario === key}
                  onChange={() => handleChange('scenario', localFilters.scenario === key ? '' : key)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">{label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* فیلتر اولویت */}
        <FilterSection title="اولویت">
          <div className="space-y-2">
            {['low', 'medium', 'high', 'critical'].map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.urgency === level}
                  onChange={() => handleChange('urgency', localFilters.urgency === level ? '' : level)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  {level === 'low' ? 'کم' : level === 'medium' ? 'متوسط' : level === 'high' ? 'زیاد' : 'بحرانی'}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </>
  )
}