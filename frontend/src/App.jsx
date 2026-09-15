// InduService\frontend\src\App.jsx
import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from '@routes'
import { useAuthStore } from '@stores/authStore'
import { useThemeStore } from '@stores/themeStore'
import { authApi } from '@features/auth/services/authApi'
import { ErrorBoundary } from '@components/ErrorBoundary'
import { TourGuide } from '@components/common';

function App() {
  const { setUser, setLoading } = useAuthStore()
  const { initTheme } = useThemeStore()

  useEffect(() => {
    // پاک کردن وضعیت localStorage که باعث باگ سبد خرید می‌شود
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.includes('cart') || key.includes('ui-storage')) {
          localStorage.removeItem(key)
        }
      }
    } catch (e) {
      // ignore errors
    }

    // مقداردهی اولیه Theme
    initTheme()
  }, [initTheme])

  useEffect(() => {
    const initAuth = async () => {
      const token = useAuthStore.getState().accessToken

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const userData = await authApi.getCurrentUser()
        setUser(userData)
      } catch (error) {
        // فقط ۴۰۱ را ignore کن - کاربر لاگین نکرده
        if (error.response?.status !== 401) {
          console.error('Auth error:', error)
        }
        useAuthStore.setState({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false
        })
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [setUser, setLoading])

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <TourGuide />
    </ErrorBoundary>
  )
}

export default App