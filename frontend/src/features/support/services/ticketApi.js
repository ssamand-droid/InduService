// src/features/support/services/ticketApi.js
import api from '@lib/axios'

const BASE_URL = '/api/support'

export const ticketApi = {
  // ─── کاربر ────────────────────────────────────────────────

  // دریافت لیست تیکت‌های خود
  getMyTickets: (params = {}) => {
    return api.get(`${BASE_URL}/tickets/`, { params })
  },

  // دریافت جزئیات تیکت
  getTicket: (id) => {
    return api.get(`${BASE_URL}/tickets/${id}/`)
  },

  // ایجاد تیکت جدید
  createTicket: (data) => {
    return api.post(`${BASE_URL}/tickets/`, data)
  },

  // بستن تیکت
  closeTicket: (id) => {
    return api.post(`${BASE_URL}/tickets/${id}/close/`)
  },

  // دریافت پیام‌های تیکت
  getTicketMessages: (id) => {
    return api.get(`${BASE_URL}/tickets/${id}/messages/`)
  },

  // ارسال پیام جدید
  sendMessage: (id, data) => {
    return api.post(`${BASE_URL}/tickets/${id}/messages/`, data)
  },

  // ─── ادمین ────────────────────────────────────────────────

  // دریافت لیست همه تیکت‌ها (ادمین)
  getAllTickets: (params = {}) => {
    return api.get(`${BASE_URL}/admin/tickets/`, { params })
  },

  // به‌روزرسانی تیکت توسط ادمین
  updateTicket: (id, data) => {
    return api.patch(`${BASE_URL}/tickets/${id}/`, data)
  },
}