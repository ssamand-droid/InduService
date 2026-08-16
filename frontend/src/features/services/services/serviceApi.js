// frontend/src/features/services/services/serviceApi.js

import api from '@lib/axios'
import { buildQueryString } from '@lib/utils'

export const serviceApi = {
  // ========================
  // Services
  // ========================
  getServices: async (filters = {}) => {
    const queryString = buildQueryString(filters)
    const response = await api.get(`/api/services/services/${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  getService: async (slug) => {
    const response = await api.get(`/api/services/services/${slug}/`)
    return response.data
  },

  getMyServices: async () => {
    const response = await api.get('/api/services/services/my_services/')
    return response.data
  },

  createService: async (serviceData) => {
    const response = await api.post('/api/services/services/', serviceData)
    return response.data
  },

  updateService: async (slug, serviceData) => {
    const response = await api.patch(`/api/services/services/${slug}/`, serviceData)
    return response.data
  },

  deleteService: async (slug) => {
    const response = await api.delete(`/api/services/services/${slug}/`)
    return response.data
  },

  getServiceCategories: async () => {
    const response = await api.get('/api/services/categories/')
    return response.data
  },

  // ========================
  // Service Requests
  // ========================
  createServiceRequest: async (requestData) => {
    const response = await api.post('/api/services/requests/', requestData)
    // اضافه کردن اطلاعات تطابق به پاسخ
    return {
      ...response.data,
      matched_service: response.data.service,
      no_match_found: !response.data.service
    }
  },

  getServiceRequests: async () => {
    const response = await api.get('/api/services/requests/')
    return response.data
  },

  getServiceRequest: async (id) => {
    const response = await api.get(`/api/services/requests/${id}/`)
    return response.data
  },

  updateServiceRequest: async (id, data) => {
    const response = await api.patch(`/api/services/requests/${id}/`, data)
    return response.data
  },

  buyerUpdateRequest: async (id, data) => {
    const response = await api.patch(`/api/services/requests/${id}/update_request/`, data)
    return response.data
  },

  acceptQuote: async (id, data = {}) => {
    const response = await api.post(`/api/services/requests/${id}/accept_quote/`, data)
    return response.data
  },

  startWork: async (id) => {
    const response = await api.post(`/api/services/requests/${id}/start_work/`)
    return response.data
  },

  completeService: async (id) => {
    const response = await api.post(`/api/services/requests/${id}/complete/`)
    return response.data
  },

  uploadAttachment: async (requestId, file, description = '') => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    const response = await api.post(`/api/services/requests/${requestId}/upload_attachment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  providerQuote: async (id, data) => {
    const response = await api.post(`/api/services/requests/${id}/provider_quote/`, data)
    return response.data
  },

  forceMajeure: async (id, reason) => {
    const response = await api.post(`/api/services/requests/${id}/force_majeure/`, { reason })
    return response.data
  },

  completeWithImages: async (id, formData) => {
    const response = await api.post(`/api/services/requests/${id}/complete_with_images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  payAdvance: async (id, file) => {
    const formData = new FormData()
    formData.append('receipt', file)
    const response = await api.post(`/api/services/requests/${id}/pay_advance/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  finalPayment: async (id, file = null) => {
    const formData = new FormData()
    if (file) formData.append('receipt', file)
    const response = await api.post(`/api/services/requests/${id}/final_payment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  submitReview: async (id, data) => {
    const response = await api.post(`/api/services/requests/${id}/submit_review/`, data)
    return response.data
  },

  uploadPaymentReceipt: async (requestId, file, paymentType = 'final') => {
    const formData = new FormData()
    formData.append('receipt', file)
    formData.append('payment_type', paymentType)
    const response = await api.post(`/api/services/requests/${requestId}/upload_payment_receipt/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // ========================
  // پیدا کردن سرویس مرتبط
  // ========================
  findMatchingService: async (title, description) => {
    const response = await api.post('/api/services/match/', { title, description })
    return response.data
  },
}