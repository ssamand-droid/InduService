import React from 'react'
import { cn } from '@lib/utils'
import { ArrowUp, ArrowDown } from 'lucide-react'

const StatsCard = ({ 
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  color = 'indigo',
  className
}) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  }

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-3 rounded-xl', colorMap[color])}>
          {Icon && <Icon size={22} />}
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(trend)}%
            {trendLabel && <span className="text-gray-400 ml-1">{trendLabel}</span>}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

export default StatsCard