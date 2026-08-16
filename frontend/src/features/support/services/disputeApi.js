// src/features/support/services/disputeApi.js
import api from '@lib/axios'

const BASE_URL = '/api/support'

export const disputeApi = {
  // ایجاد اختلاف جدید
  createDispute: (data) => {
    return api.post(`${BASE_URL}/disputes/`, data)
  },

  // دریافت جزئیات اختلاف
  getDispute: (id) => {
    return api.get(`${BASE_URL}/disputes/${id}/`)
  },

  // حل اختلاف توسط ادمین
  resolveDispute: (id, data) => {
    return api.patch(`${BASE_URL}/disputes/${id}/`, data)
  },
}