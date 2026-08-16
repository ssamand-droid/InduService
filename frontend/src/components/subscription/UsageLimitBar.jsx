import React from 'react'
import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'

const UsageLimitBar = ({ used, limit, className = '' }) => {
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0
  const isNearLimit = percentage >= 80
  const isAtLimit = used >= limit

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">
          دارایی‌ها: {used} / {limit >= 999 ? '∞' : limit}
        </span>
        <span className={isAtLimit ? 'text-red-600 font-bold' : isNearLimit ? 'text-yellow-600' : 'text-gray-400'}>
          {percentage}٪
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {(isNearLimit || isAtLimit) && limit < 999 && (
        <Link
          to="/pricing"
          className="flex items-center justify-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Crown size={12} />
          ارتقاء به حرفه‌ای (نامحدود)
        </Link>
      )}
    </div>
  )
}

export default UsageLimitBar