// frontend/src/lib/axios.js

import axios from 'axios'
import { useAuthStore } from '@stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor - اضافه کردن توکن به هدر
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - مدیریت خطاها و رفرش توکن
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // اگر خطای 401 باشد و قبلاً retry نشده باشد و درخواست رفرش نباشد
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/token/refresh/')) {
      originalRequest._retry = true

      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState()
        
        if (!refreshToken) {
          logout()
          // فقط در مرورگر ریدایرکت کن
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }

        // تلاش برای رفرش توکن
        const response = await axios.post(
          `${api.defaults.baseURL}/api/token/refresh/`,
          { refresh: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )

        const { access } = response.data
        if (access) {
          setTokens(access, refreshToken)
          // تکرار درخواست اصلی با توکن جدید
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } else {
          throw new Error('No access token in refresh response')
        }
      } catch (refreshError) {
        // اگر رفرش هم خطا داد، کاربر را logout کن
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // مدیریت خطاهای دیگر
    if (error.response?.data) {
      const errorMessage = error.response.data.error?.message || error.response.data.detail || 'خطایی رخ داده است.'
      error.userMessage = errorMessage
    }

    return Promise.reject(error)
  }
)

export default api