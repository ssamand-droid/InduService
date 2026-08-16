import React from 'react'
import { AlertTriangle, ArrowLeft, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'

const UpgradeBanner = ({ message, usage, limit, variant = 'warning' }) => {
  const variants = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
    danger: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
  }

  const percentage = usage && limit ? Math.round((usage / limit) * 100) : 0

  return (
    <div className={`${variants[variant]} border rounded-2xl p-4 md:p-5`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {variant === 'danger' ? (
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={22} />
          ) : (
            <Crown className="flex-shrink-0 mt-0.5" size={22} />
          )}
          <div>
            <h3 className="font-bold text-base mb-1">
              {message || 'محدودیت طرح رایگان'}
            </h3>
            {usage && limit && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{usage} از {limit}</span>
                  <span>{percentage}٪</span>
                </div>
                <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <Link
          to="/pricing"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 rounded-xl font-bold text-sm hover:shadow-md transition whitespace-nowrap border border-current"
        >
          <Crown size={16} />
          ارتقاء به حرفه‌ای
          <ArrowLeft size={16} />
        </Link>
      </div>
    </div>
  )
}

export default UpgradeBanner