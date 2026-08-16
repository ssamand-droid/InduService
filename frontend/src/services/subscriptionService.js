import api from '@lib/axios'

const subscriptionService = {
  // طرح‌ها
  getPlans: () => api.get('/api/subscription/plans/'),
  getPlan: (slug) => api.get(`/api/subscription/plans/${slug}/`),

  // اشتراک کاربر (URL های صحیح)
  getActiveSubscription: () => api.get('/api/subscription/active/'),
  getMySubscription: () => api.get('/api/subscription/my-subscription/'),
  getUsageStats: () => api.get('/api/subscription/usage-stats/'),
  
  // ارتقاء و لغو
  upgrade: (planSlug, billingCycle = 'monthly') => api.post('/api/subscription/upgrade/', {
    plan_slug: planSlug,
    billing_cycle: billingCycle,
  }),
  cancel: () => api.post('/api/subscription/cancel/'),
}

export default subscriptionService