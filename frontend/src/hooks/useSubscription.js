import { useState, useEffect, useCallback } from 'react'
import subscriptionService from '@services/subscriptionService'

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null)
  const [plan, setPlan] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSubscription = useCallback(async () => {

    try {
      setLoading(true)
      const [subRes, usageRes] = await Promise.all([
        subscriptionService.getActiveSubscription(),
        subscriptionService.getUsageStats(),
      ])
      setSubscription(subRes.data)
      setPlan(subRes.data?.plan)
      setUsage(usageRes.data)
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const canUseFeature = (feature) => {
    if (!plan) return false
    const features = {
      bulkImport: plan.has_bulk_import,
      predictiveMaintenance: plan.has_predictive_maintenance,
      advancedAnalytics: plan.has_advanced_analytics,
      apiAccess: plan.has_api_access,
    }
    return features[feature] || false
  }

  const isNearLimit = () => {
    if (!usage || !plan) return false
    return usage.assets_used >= plan.max_assets * 0.8
  }

  const isAtLimit = () => {
    if (!usage || !plan) return false
    return usage.assets_used >= plan.max_assets
  }

  const getLimitMessage = () => {
    if (isAtLimit()) return 'به سقف تعداد دستگاه‌ها رسیده‌اید'
    if (isNearLimit()) return 'به سقف تعداد دستگاه‌ها نزدیک شده‌اید'
    return null
  }

  return {
    subscription,
    plan,
    usage,
    loading,
    error,
    canUseFeature,
    isNearLimit,
    isAtLimit,
    getLimitMessage,
    refetch: fetchSubscription,
  }
}
