import React from 'react'
import { Package } from 'lucide-react'

const EmptyState = ({
  icon: Icon = Package,
  title = 'داده‌ای یافت نشد',
  description = 'هنوز چیزی اینجا ثبت نشده است',
  action,
  actionLabel,
  actionLink,
  size = 'md'
}) => {
  const sizes = {
    sm: { iconSize: 40, titleSize: 'text-lg', descSize: 'text-sm' },
    md: { iconSize: 64, titleSize: 'text-xl', descSize: 'text-base' },
    lg: { iconSize: 80, titleSize: 'text-2xl', descSize: 'text-lg' },
  }

  const { iconSize, titleSize, descSize } = sizes[size] || sizes.md

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-6">
        <Icon className="text-gray-400 dark:text-gray-600" size={iconSize} />
      </div>
      <h3 className={`${titleSize} font-bold text-gray-600 dark:text-gray-300 mb-2`}>
        {title}
      </h3>
      <p className={`${descSize} text-gray-400 dark:text-gray-500 mb-8 text-center max-w-md`}>
        {description}
      </p>
      {action && (
        <button
          onClick={action}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
        >
          {actionLabel || 'شروع کنید'}
        </button>
      )}
    </div>
  )
}

export default EmptyState