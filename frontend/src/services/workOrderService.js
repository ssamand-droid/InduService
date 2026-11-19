import api from '@lib/axios'

const workOrderService = {
  list: () => api.get('/api/work-orders/'),
  createFromRequest: (requestId) => api.post(`/api/work-orders/from-request/${requestId}/`),
  transition: (id, data) => api.post(`/api/work-orders/${id}/transition/`, data),
  addTask: (id, data) => api.post(`/api/work-orders/${id}/tasks/`, data),
  updateTask: (id, taskId, data) => api.patch(`/api/work-orders/${id}/tasks/${taskId}/`, data),
  addEvidence: (id, formData) => api.post(`/api/work-orders/${id}/evidence/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export default workOrderService
