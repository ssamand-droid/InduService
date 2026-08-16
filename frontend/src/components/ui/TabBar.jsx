import React from 'react'
import { cn } from '@lib/utils'

const TabBar = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex border-b border-gray-200 dark:border-gray-700', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative',
            activeTab === tab.key
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          {tab.icon && <tab.icon size={18} />}
          {tab.label}
          {tab.badge && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {tab.badge}
            </span>
          )}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}

export default TabBar