// src/features/notifications/services/notificationApi.js

import api from '@lib/axios'

export const notificationApi = {
  // دریافت لیست اعلان‌ها
  getNotifications: async (page = 1) => {
    try {
      const response = await api.get(`/api/notifications/notifications/?page=${page}`)
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // بازگرداندن ساختار خالی در صورت خطا
      return { results: [], count: 0, next: null, previous: null }
    }
  },

  // دریافت تعداد اعلان‌های خوانده نشده
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/notifications/notifications/unread_count/')
      return response.data
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return { unread_count: 0 }
    }
  },

  // علامت‌گذاری به عنوان خوانده شده
  markAsRead: async (notificationIds) => {
    try {
      const response = await api.post('/api/notifications/notifications/mark_as_read/', {
        notification_ids: notificationIds,
      })
      return response.data
    } catch (error) {
      console.error('Error marking as read:', error)
      throw error
    }
  },

  // علامت‌گذاری همه به عنوان خوانده شده
  markAllAsRead: async () => {
    try {
      const response = await api.post('/api/notifications/notifications/mark_all_read/')
      return response.data
    } catch (error) {
      console.error('Error marking all as read:', error)
      throw error
    }
  },
}