import React from 'react'
import { useSubscription } from '@hooks/useSubscription'
import { Spinner } from '@components/ui'
import PlanCard from '@components/subscription/PlanCard'
import SubscriptionBadge from '@components/subscription/SubscriptionBadge'
import { Calendar, CreditCard, AlertCircle } from 'lucide-react'

const SubscriptionPage = () => {
  const { subscription, plan, usage, loading } = useSubscription()

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">اشتراک من</h1>

      {/* وضعیت فعلی */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">وضعیت اشتراک</h2>
          <SubscriptionBadge subscription={subscription} />
        </div>

        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Calendar className="text-indigo-500" size={20} />
              <div>
                <p className="text-gray-500">تاریخ شروع</p>
                <p className="font-bold">{new Date(subscription.start_date).toLocaleDateString('fa-IR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <CreditCard className="text-indigo-500" size={20} />
              <div>
                <p className="text-gray-500">دوره پرداخت</p>
                <p className="font-bold">{subscription.billing_cycle === 'monthly' ? 'ماهانه' : 'سالانه'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <AlertCircle className="text-indigo-500" size={20} />
              <div>
                <p className="text-gray-500">تمدید خودکار</p>
                <p className="font-bold">{subscription.auto_renew ? 'فعال' : 'غیرفعال'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* میزان مصرف */}
      {usage && plan && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-lg mb-4">میزان مصرف</h2>
          <div className="space-y-4">
            <UsageBar label="دارایی‌ها" used={usage.assets_used} limit={plan.max_assets} />
            <UsageBar label="سنسورها" used={usage.sensors_used || 0} limit={plan.max_sensors} />
            <UsageBar label="کاربران" used={usage.users_used || 1} limit={plan.max_users} />
          </div>
        </div>
      )}
    </div>
  )
}

const UsageBar = ({ label, used, limit }) => {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{used} / {limit >= 999 ? '∞' : limit}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default SubscriptionPage