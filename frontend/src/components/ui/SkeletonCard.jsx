import React from 'react'

const SkeletonCard = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
          {/* Image skeleton */}
          <div className="h-48 bg-gray-200 dark:bg-gray-700" />
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonCard