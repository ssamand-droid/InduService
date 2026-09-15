// src/components/ui/PageHeader.jsx
import React from 'react'
import { cn } from '@lib/utils'

// ✅ named export اضافه شد
export const PageHeader = ({
  title,
  description,
  actions,
  className
}) => {
  return (
    <div className={cn(
      'flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8',
      className
    )}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}

// برای سازگاری با import های قدیمی
export default PageHeader