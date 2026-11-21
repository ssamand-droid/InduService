import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { Spinner } from '@components/ui'

/**
 * PrivateRoute - محافظت از مسیرهای خصوصی
 * چک می‌کند کاربر احراز هویت شده باشد و نقش مجاز داشته باشد.
 *
 * @param {Array} allowedRoles - آرایه‌ای از نقش‌های مجاز (مثلاً ['buyer']). اگر خالی باشد، هر کاربر لاگین‌شده مجاز است.
 */
export const PrivateRoute = ({ allowedRoles = [], allowStaff = false, requiredOrganizationMembership = false }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  // اگر در حال بارگذاری اولیه هستیم (بررسی توکن ذخیره شده)
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

  // نقش‌های مجاز؛ در صورت تصریح مسیر، staff نیز مجاز است.
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role) && !(allowStaff && user?.is_staff)) {
    return <Navigate to="/" replace />
  }

  // تدارکات و دفترکل فقط برای مدیر سیستم یا عضو فعال یک سازمان.
  const isAdmin = user?.role === 'admin' || user?.is_staff
  const hasActiveOrganization = (user?.organization_memberships || []).some((membership) => membership.is_active)
  if (requiredOrganizationMembership && !isAdmin && !hasActiveOrganization) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}