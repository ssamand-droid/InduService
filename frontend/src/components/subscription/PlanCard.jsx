import React from 'react'
import { Check, Star, Zap, Building, Crown, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const iconMap = {
  star: Star,
  zap: Zap,
  building: Building,
  crown: Crown,
  package: Shield,
}

const PlanCard = ({ plan, isCurrentPlan, onSelect, isLoading }) => {
  const Icon = iconMap[plan.icon] || Star
  const navigate = useNavigate()

  return (
    <div className={`
      relative rounded-2xl p-6 md:p-8 transition-all duration-300
      ${plan.is_featured 
        ? 'border-2 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-105 bg-white dark:bg-gray-800' 
        : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg'
      }
      ${isCurrentPlan ? 'ring-2 ring-green-500 ring-offset-2' : ''}
    `}>
      
      {plan.is_featured && (
        <div className="absolute -top-3 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold">
          محبوب‌ترین
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 left-6 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">
          طرح فعلی
        </div>
      )}

      {/* آیکون و نام */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${plan.color === 'blue' ? 'from-blue-500 to-indigo-500' : plan.color === 'purple' ? 'from-purple-500 to-pink-500' : 'from-gray-400 to-gray-500'} text-white`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
        </div>
      </div>

      {/* قیمت */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
        {plan.price_monthly === 0 ? (
          <div className="text-3xl font-bold text-green-600">رایگان</div>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {plan.price_monthly.toLocaleString()}
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal"> تومان</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">/ماه</div>
            {plan.price_yearly > 0 && (
              <div className="text-xs text-green-600 mt-1">
                {plan.price_yearly.toLocaleString()} تومان (سالانه - صرفه‌جویی)
              </div>
            )}
          </>
        )}
      </div>

      {/* ویژگی‌ها */}
      <ul className="space-y-3 mb-6">
        <FeatureItem label={`${plan.max_assets >= 999 ? 'نامحدود' : plan.max_assets} دارایی`} />
        <FeatureItem label={`${plan.max_users} کاربر`} />
        <FeatureItem label={`${plan.max_sensors} سنسور`} available={plan.max_sensors > 0} />
        <FeatureItem label="تحلیل پیشرفته" available={plan.has_advanced_analytics} />
        <FeatureItem label="نگهداری پیش‌بینانه" available={plan.has_predictive_maintenance} />
        <FeatureItem label="واردات انبوه" available={plan.has_bulk_import} />
        <FeatureItem label="دسترسی API" available={plan.has_api_access} />
        <FeatureItem label="پشتیبانی ویژه" available={plan.has_priority_support} />
        <FeatureItem label="برندینگ اختصاصی" available={plan.has_custom_branding} />
      </ul>

      {/* دکمه */}
      <button
        onClick={() => onSelect?.(plan) || navigate(`/dashboard/subscription/upgrade?plan=${plan.slug}`)}
        disabled={isCurrentPlan || isLoading}
        className={`
          w-full py-3 rounded-xl font-bold transition
          ${isCurrentPlan 
            ? 'bg-green-100 text-green-700 cursor-default' 
            : plan.price_monthly === 0 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
          }
        `}
      >
        {isCurrentPlan ? '✓ طرح فعلی' : plan.price_monthly === 0 ? 'شروع رایگان' : 'ارتقاء به این طرح'}
      </button>
    </div>
  )
}

const FeatureItem = ({ label, available = true }) => (
  <li className="flex items-center gap-2">
    {available ? (
      <Check size={18} className="text-green-500 flex-shrink-0" />
    ) : (
      <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
        <span className="w-4 h-0.5 bg-gray-300 rounded" />
      </span>
    )}
    <span className={available ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}>
      {label}
    </span>
  </li>
)

export default PlanCard