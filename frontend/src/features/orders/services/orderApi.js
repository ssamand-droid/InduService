import api from '@lib/axios'
import { buildQueryString } from '@lib/utils'

export const orderApi = {
  // ایجاد سفارش جدید
  createOrder: async (orderData) => {
    const response = await api.post('/api/orders/orders/', orderData)
    return response.data
  },

  // دریافت سفارشات خریدار
  getOrders: async (filters = {}) => {
    const queryString = buildQueryString(filters)
    const response = await api.get(`/api/orders/orders/${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  // دریافت سفارشات فروشنده
  getSellerOrders: async () => {
    const response = await api.get('/api/orders/orders/')
    return response.data
  },

  // دریافت جزئیات یک سفارش
  getOrder: async (id) => {
    const response = await api.get(`/api/orders/orders/${id}/`)
    return response.data
  },

  // تایید سفارش (فروشنده)
  confirmOrder: async (id) => {
    const response = await api.post(`/api/orders/orders/${id}/confirm/`)
    return response.data
  },

  // ثبت ارسال (فروشنده)
  shipOrder: async (id) => {
    const response = await api.post(`/api/orders/orders/${id}/ship/`)
    return response.data
  },

  // تایید تحویل (خریدار)
  deliverOrder: async (id) => {
    const response = await api.post(`/api/orders/orders/${id}/deliver/`)
    return response.data
  },

  // تکمیل سفارش
  completeOrder: async (id) => {
    const response = await api.post(`/api/orders/orders/${id}/complete/`)
    return response.data
  },

  // افزودن مرحله MRO
  addMROStep: async (orderId, data) => {
    const response = await api.post(`/api/orders/orders/${orderId}/add_mro_step/`, data)
    return response.data
  },

  // بروزرسانی مرحله MRO
  updateMROStep: async (orderId, stepId, data) => {
    const response = await api.patch(`/api/orders/orders/${orderId}/mro-step/${stepId}/`, data)
    return response.data
  },

  // آپلود رسید پرداخت
  uploadReceipt: async (orderId, file) => {
    const formData = new FormData()
    formData.append('receipt', file)
    const response = await api.post(`/api/orders/orders/${orderId}/upload_receipt/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}