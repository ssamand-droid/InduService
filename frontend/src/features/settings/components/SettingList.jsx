// src/features/settings/components/SettingList.jsx
import { useState } from 'react'
import { FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi'
import { Badge, Button, Input, Spinner } from '@components/ui'
import { cn } from '@lib/utils'

const TYPE_COLORS = {
  general: 'secondary',
  commission: 'warning',
  payment: 'info',
  seo: 'primary',
  notification: 'success',
}

const TYPE_LABELS = {
  general: 'عمومی',
  commission: 'کمیسیون',
  payment: 'پرداخت',
  seo: 'SEO',
  notification: 'اعلان‌ها',
}

export const SettingList = ({
  settings = [],
  isLoading = false,
  onEdit,
  onDelete,
  onSearch,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

  const handleSearch = (value) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (settings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">تنظیمی یافت نشد</p>
        <p className="text-sm mt-1">برای ایجاد تنظیم جدید، دکمه اضافه را بزنید</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* فیلترها */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="جستجو در کلید یا عنوان..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">همه انواع</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* لیست تنظیمات */}
      <div className="space-y-2">
        {settings
          .filter(item => {
            if (filterType && item.setting_type !== filterType) return false
            if (searchTerm) {
              const search = searchTerm.toLowerCase()
              return item.key.toLowerCase().includes(search) ||
                     item.title?.toLowerCase().includes(search)
            }
            return true
          })
          .map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Badge variant={TYPE_COLORS[item.setting_type] || 'secondary'} size="sm">
                  {TYPE_LABELS[item.setting_type] || item.setting_type}
                </Badge>
                <span className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                  {item.title || item.key}
                </span>
              </div>

              <code className="text-sm bg-white dark:bg-gray-700 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 flex-1 w-full sm:w-auto truncate max-w-[200px] sm:max-w-none">
                {item.value}
              </code>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(item)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <FiEdit2 className="h-4 w-4" />
                  <span className="sr-only">ویرایش</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(item.id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <FiTrash2 className="h-4 w-4" />
                  <span className="sr-only">حذف</span>
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}