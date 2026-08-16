import React, { useState, useEffect } from 'react'
import { Check, Star, Zap, Building } from 'lucide-react'
import api from '@lib/axios'

const planIcons = { free: Zap, pro: Star, enterprise: Building }

const PricingPage = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/subscription/plans/').then(res => {
      setPlans(res.data?.results || res.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20">Loading...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold">انتخاب طرح اشتراک</h1>
        <p className="text-gray-500 mt-2">طرح مناسب خود را انتخاب کنید</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const Icon = planIcons[plan.slug] || Star
          return (
            <div key={plan.id} className={`rounded-2xl p-8 border-2 ${
              plan.is_featured ? 'border-indigo-500 shadow-xl scale-105' : 'border-gray-200'
            }`}>
              {plan.is_featured && (
                <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs">محبوب</span>
              )}
              <Icon className="mt-4" size={40} />
              <h2 className="text-2xl font-bold mt-4">{plan.name}</h2>
              <p className="text-gray-500 mt-2">{plan.description}</p>
              <div className="mt-6 text-4xl font-bold">
                {plan.price_monthly === 0 ? 'رایگان' : `${plan.price_monthly.toLocaleString()} تومان`}
                <span className="text-sm text-gray-400">/ماه</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li><Check size={16} className="inline text-green-500" /> {plan.max_assets} دارایی</li>
                <li><Check size={16} className="inline text-green-500" /> {plan.max_users} کاربر</li>
                {plan.has_predictive_maintenance && <li><Check size={16} className="inline text-green-500" /> نگهداری پیش‌بینانه</li>}
                {plan.has_bulk_import && <li><Check size={16} className="inline text-green-500" /> واردات انبوه</li>}
                {plan.has_api_access && <li><Check size={16} className="inline text-green-500" /> API</li>}
              </ul>
              <button className="w-full mt-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                {plan.price_monthly === 0 ? 'شروع رایگان' : 'ارتقاء'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PricingPage