// src/components/ui/EmptyState.jsx
import React from 'react';
import { Package } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Package,
  title = 'داده‌ای یافت نشد',
  description = 'هنوز چیزی اینجا ثبت نشده است',
  action,
  actionLabel = 'شروع کنید',
  actionLink,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: { iconSize: 40, titleSize: 'text-lg', descSize: 'text-sm', padding: 'py-10' },
    md: { iconSize: 64, titleSize: 'text-xl', descSize: 'text-base', padding: 'py-16' },
    lg: { iconSize: 80, titleSize: 'text-2xl', descSize: 'text-lg', padding: 'py-20' },
  };

  const { iconSize, titleSize, descSize, padding } = sizes[size] || sizes.md;

  // اگر actionLink داده شده باشد، از Link استفاده می‌کنیم
  const ActionButton = () => {
    if (action) {
      return (
        <button
          onClick={action}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          {actionLabel}
        </button>
      );
    }
    if (actionLink) {
      return (
        <a
          href={actionLink}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium inline-block"
        >
          {actionLabel}
        </a>
      );
    }
    return null;
  };

  return (
    <div className={`flex flex-col items-center justify-center ${padding} px-4 ${className}`}>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-6">
        <Icon className="text-gray-400 dark:text-gray-600" size={iconSize} />
      </div>
      <h3 className={`${titleSize} font-bold text-gray-600 dark:text-gray-300 mb-2`}>
        {title}
      </h3>
      <p className={`${descSize} text-gray-400 dark:text-gray-500 mb-8 text-center max-w-md`}>
        {description}
      </p>
      <ActionButton />
    </div>
  );
};

export default EmptyState;