import React from 'react'
import { INDUSTRIES, INDUSTRY_CATEGORIES } from '../../data/industries'
import { Factory } from 'lucide-react'

const IndustrySelector = ({ value, onChange, compact = false }) => {
  const selectedIndustry = value ? INDUSTRIES[value] : null

  if (compact && selectedIndustry) {
    // نمایش فشرده - فقط صنعت انتخاب شده
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
        <span className="text-lg">{selectedIndustry.icon}</span>
        <span>{selectedIndustry.label}</span>
        <button
          onClick={() => onChange('')}
          className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* انتخاب سریع با کارت‌های بزرگ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(INDUSTRIES).map(([key, industry]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key === value ? '' : key)}
            className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-center group ${
              value === key
                ? 'border-blue-600 bg-blue-50 text-slate-800 shadow-md'  // تغییر: بدون گرادیانت رنگی، فقط border آبی و پس‌زمینه بسیار ملایم
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            }`}
          >
            <div className={`text-3xl mb-2 transition-transform duration-300 ${
              value === key ? 'scale-110' : 'group-hover:scale-110'
            }`}>
              {industry.icon}
            </div>
            <h3 className={`text-sm font-bold ${
              value === key ? 'text-blue-700' : 'text-slate-700'
            }`}>
              {industry.label}
            </h3>
            {value === key && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default IndustrySelector