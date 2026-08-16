import React from 'react'
import { Crown, Zap, Building, Clock, AlertTriangle } from 'lucide-react'

const statusConfig = {
  active: { icon: Crown, color: 'bg-green-100 text-green-700', label: 'فعال' },
  trial: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'آزمایشی' },
  expired: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'منقضی' },
  cancelled: { icon: AlertTriangle, color: 'bg-gray-100 text-gray-700', label: 'لغو شده' },
}

const planIcons = { free: Zap, pro: Crown, enterprise: Building }

const SubscriptionBadge = ({ subscription, showDays = true }) => {
  if (!subscription) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
        <Zap size={14} /> رایگان
      </span>
    )
  }

  const status = statusConfig[subscription.status] || statusConfig.active
  const StatusIcon = status.icon
  const PlanIcon = planIcons[subscription.plan?.slug] || Zap

  const daysLeft = subscription.end_date
    ? Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
        <StatusIcon size={14} />
        {status.label}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
        <PlanIcon size={14} />
        {subscription.plan?.name || 'رایگان'}
      </span>
      {showDays && daysLeft !== null && daysLeft > 0 && (
        <span className="text-xs text-gray-500">
          {daysLeft} روز باقی‌مانده
        </span>
      )}
    </div>
  )
}

export default SubscriptionBadge