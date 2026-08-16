import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { Spinner } from '@components/ui'

/**
 * PrivateRoute - محافظت از مسیرهای خصوصی
 * @param {Array} allowedRoles - آرایه‌ای از نقش‌های مجاز
 */
export const PrivateRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  // ✅ صبر کن تا isLoading تمام شود
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">در حال بررسی احراز هویت...</p>
        </div>
      </div>
    )
  }

  // اگر کاربر لاگین نکرده باشد
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // اگر نقش‌های مجاز تعیین شده باشد و نقش کاربر در آن‌ها نباشد
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}