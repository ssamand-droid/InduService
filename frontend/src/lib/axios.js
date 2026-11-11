// frontend/src/lib/axios.js
import axios from 'axios'
import { useAuthStore } from '@stores/authStore'

const api = axios.create({
  // Empty base URL keeps API calls on the current origin. Vite proxies /api
  // during development; production can set VITE_API_BASE_URL when needed.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// تابع کمکی برای گرفتن توکن با تاخیر (برای اطمینان از هیدرات شدن store)
const getToken = () => {
  // تلاش برای گرفتن مستقیم از store
  let token = useAuthStore.getState().accessToken

  // اگر در store نبود، از localStorage مستقیم بخوان (چون persist از localStorage استفاده می‌کند)
  if (!token) {
    try {
      const persistedData = localStorage.getItem('induservice-auth-storage')
      if (persistedData) {
        const parsed = JSON.parse(persistedData)
        token = parsed.state?.accessToken || parsed.accessToken
        console.log('axios - token from localStorage persistence:', token ? 'exists' : 'null')
      }
    } catch (e) {
      console.error('axios - error reading from localStorage:', e)
    }
  }

  return token
}

// Request interceptor - اضافه کردن توکن به هدر
api.interceptors.request.use(
  (config) => {
    console.log('axios request:', config.method, config.url)

    const token = getToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('axios - Authorization header added for:', config.url)
    } else {
      console.log('axios - No token found for:', config.url)
    }
    return config
  },
  (error) => {
    console.error('axios interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - مدیریت خطای 401
api.interceptors.response.use(
  (response) => {
    console.log('axios response success:', response.config.url, response.status)
    return response
  },
  async (error) => {
    console.error('axios response error:', error.config?.url, error.response?.status)

    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/token/refresh/')
    ) {
      originalRequest._retry = true

      try {
        // گرفتن refreshToken
        let refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) {
          try {
            const persistedData = localStorage.getItem('induservice-auth-storage')
            if (persistedData) {
              const parsed = JSON.parse(persistedData)
              refreshToken = parsed.state?.refreshToken || parsed.refreshToken
            }
          } catch (e) {}
        }

        console.log('Attempting to refresh token...')

        const response = await api.post('/api/token/refresh/', { refresh: refreshToken })

        const { access } = response.data
        console.log('Token refreshed successfully')

        // ذخیره توکن جدید در store و localStorage
        const currentState = useAuthStore.getState()
        useAuthStore.setState({
          accessToken: access,
          refreshToken: currentState.refreshToken,
          isAuthenticated: true
        })

        // به‌روزرسانی localStorage مستقیم
        try {
          const persistedData = localStorage.getItem('induservice-auth-storage')
          if (persistedData) {
            const parsed = JSON.parse(persistedData)
            parsed.state.accessToken = access
            localStorage.setItem('induservice-auth-storage', JSON.stringify(parsed))
          }
        } catch (e) {}

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // توکن منقضی شده - logout
        localStorage.removeItem('induservice-auth-storage')
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
