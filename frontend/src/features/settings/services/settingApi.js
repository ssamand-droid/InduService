// src/features/settings/services/settingApi.js
import api from '@lib/axios'

const BASE_URL = '/api/settings'

export const settingApi = {
  // دریافت لیست تنظیمات (ادمین)
  getSettings: (params = {}) => {
    return api.get(BASE_URL, { params })
  },

  // دریافت تنظیمات عمومی (بدون لاگین)
  getPublicSettings: () => {
    return api.get(`${BASE_URL}/public/`)
  },

  // ایجاد تنظیم جدید (ادمین)
  createSetting: (data) => {
    return api.post(BASE_URL, data)
  },

  // دریافت جزئیات تنظیم (ادمین)
  getSetting: (id) => {
    return api.get(`${BASE_URL}/${id}/`)
  },

  // به‌روزرسانی تنظیم (ادمین)
  updateSetting: (id, data) => {
    return api.patch(`${BASE_URL}/${id}/`, data)
  },

  // حذف تنظیم (ادمین)
  deleteSetting: (id) => {
    return api.delete(`${BASE_URL}/${id}/`)
  },

  // به‌روزرسانی دسته‌ای (ادمین)
  bulkUpdate: (data) => {
    return api.post(`${BASE_URL}/bulk/`, data)
  },
}