// src/components/ui/SkeletonCard.jsx
import React from 'react';

const SkeletonCard = ({ count = 3, type = 'blog' }) => {
  // اسکلتون برای کارت بلاگ
  const renderBlogSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
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
  );

  // اسکلتون برای کارت محصول
  const renderProductSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20" />
        </div>
      </div>
    </div>
  );

  // اسکلتون برای کارت سرویس
  const renderServiceSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );

  // انتخاب نوع اسکلتون
  const renderSkeleton = () => {
    switch (type) {
      case 'product':
        return renderProductSkeleton();
      case 'service':
        return renderServiceSkeleton();
      case 'blog':
      default:
        return renderBlogSkeleton();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default SkeletonCard;