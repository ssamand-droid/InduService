import api from '@lib/axios'

const serviceRequestService = {
  // لیست درخواست‌ها
  getRequests: (params) => api.get('/api/services/requests/', { params }),

  // جزئیات یک درخواست
  getRequest: (id) => api.get(`/api/services/requests/${id}/`),

  // ایجاد درخواست جدید
  create: (data) => {
    // اگر FormData باشه (برای آپلود فایل)
    if (data instanceof FormData) {
      return api.post('/api/services/requests/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    // وگرنه JSON
    return api.post('/api/services/requests/', data)
  },

  // به‌روزرسانی
  update: (id, data) => api.patch(`/api/services/requests/${id}/`, data),
}

export default serviceRequestService