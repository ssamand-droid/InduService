// frontend/src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiGrid, FiPackage, FiTool, FiShoppingBag, FiClipboard,
  FiUser, FiUsers, FiSettings, FiLogOut, FiShield,
  FiFileText, FiDollarSign, FiPercent, FiMonitor,
  FiHome, FiBookOpen, FiMail, FiInfo, FiMessageSquare,
} from 'react-icons/fi'
import { useAuthStore } from '@stores/authStore'
import { useUIStore } from '@stores/uiStore'
import { BUYER_ROLES, PROVIDER_ROLES } from '@lib/constants'
import { HelpCenter } from '@components/common'  // ← اضافه شده

export const Sidebar = () => {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const closeSidebar = useUIStore((state) => state.closeSidebar)

  // ========== اضافه شده: وضعیت باز بودن HelpCenter ==========
  const [helpOpen, setHelpOpen] = useState(false)
  // ==========================================================

  // ========================
  // جعل هویت
  // ========================
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    const adminData = localStorage.getItem('admin_impersonate')
    setIsImpersonating(!!adminData)
  }, [user])

  const isBuyer = BUYER_ROLES.includes(user?.role)
  const isProvider = PROVIDER_ROLES.includes(user?.role)
  const isAdmin = user?.role === 'admin' || user?.is_staff

  // لینک‌های عمومی (برای کاربران نالاگین)
  const publicLinks = [
    { to: '/services', icon: FiTool, label: 'خدمات MRO' },
    { to: '/products', icon: FiPackage, label: 'محصولات' },
    { to: '/blog', icon: FiBookOpen, label: 'وبلاگ' },
    { to: '/about', icon: FiInfo, label: 'درباره ما' },
    { to: '/contact', icon: FiMail, label: 'تماس با ما' },
  ]

  // لینک‌های خریدار
  const buyerLinks = [
    { to: '/dashboard', icon: FiGrid, label: 'داشبورد' },
    { to: '/dashboard/assets', icon: FiMonitor, label: 'دستگاه‌ها و تجهیزات' },
    { to: '/dashboard/service-requests', icon: FiTool, label: 'درخواست‌های خدمت' },
    { to: '/dashboard/work-orders', icon: FiClipboard, label: 'دستورکارها' },
    { to: '/dashboard/procurement', icon: FiPackage, label: 'تدارکات و دفترکل' },
    { to: '/dashboard/orders', icon: FiShoppingBag, label: 'سفارش‌های من' },
    { to: '/invoices', icon: FiFileText, label: 'فاکتورها' },
    { to: '/dashboard/support', icon: FiMessageSquare, label: 'پشتیبانی' },
    // ========== اضافه شده ==========
    {
      to: '#',
      icon: FiBookOpen,
      label: 'راهنمای پلتفرم',
      onClick: () => setHelpOpen(true),
      isHelp: true,
    },
    // ================================
  ]

  // لینک‌های فروشنده / ارائه‌دهنده خدمت
  const sellerLinks = [
    { to: '/dashboard', icon: FiGrid, label: 'داشبورد' },
    { to: '/dashboard/services', icon: FiTool, label: 'خدمات من' },
    { to: '/dashboard/service-requests', icon: FiClipboard, label: 'درخواست‌های خدمت' },
    { to: '/dashboard/work-orders', icon: FiClipboard, label: 'دستورکارها' },
    { to: '/dashboard/products', icon: FiPackage, label: 'محصولات من' },
    { to: '/dashboard/manage-orders', icon: FiShoppingBag, label: 'مدیریت سفارشات' },
    { to: '/wallet', icon: FiDollarSign, label: 'کیف پول' },
    { to: '/invoices', icon: FiFileText, label: 'فاکتورها' },
    { to: '/dashboard/support', icon: FiMessageSquare, label: 'پشتیبانی' },
    // ========== اضافه شده ==========
    {
      to: '#',
      icon: FiBookOpen,
      label: 'راهنمای پلتفرم',
      onClick: () => setHelpOpen(true),
      isHelp: true,
    },
    // ================================
  ]

  // لینک‌های ادمین
  const adminLinks = [
    { to: '/dashboard/admin', icon: FiShield, label: 'داشبورد مدیریت' },
    { to: '/dashboard/admin/users', icon: FiUsers, label: 'مدیریت کاربران' },
    { to: '/dashboard/admin/services', icon: FiTool, label: 'مدیریت خدمات' },
    { to: '/dashboard/admin/service-requests', icon: FiClipboard, label: 'مدیریت درخواست‌ها' },
    { to: '/dashboard/admin/products', icon: FiPackage, label: 'مدیریت محصولات' },
    { to: '/dashboard/admin/orders', icon: FiShoppingBag, label: 'مدیریت سفارشات' },
    { to: '/dashboard/admin/finance', icon: FiDollarSign, label: 'مدیریت مالی' },
    { to: '/dashboard/procurement', icon: FiPackage, label: 'تدارکات و دفترکل' },
    { to: '/dashboard/admin/blog', icon: FiFileText, label: 'مدیریت وبلاگ' },
    { to: '/dashboard/admin/settings', icon: FiSettings, label: 'تنظیمات پلتفرم' },
    { to: '/dashboard/admin/commission', icon: FiPercent, label: 'کمیسیون و پیش‌پرداخت' },
    { to: '/dashboard/admin/support', icon: FiMessageSquare, label: 'مدیریت پشتیبانی' },
    // ========== اضافه شده ==========
    {
      to: '#',
      icon: FiBookOpen,
      label: ' راهنمای پلتفرم',
      onClick: () => setHelpOpen(true),
      isHelp: true,
    },
    // ================================
  ]

  // انتخاب لینک‌ها بر اساس وضعیت لاگین و نقش
  let links = publicLinks
  let roleLabel = 'منوی اصلی'

  if (isAuthenticated && !isImpersonating) {
    if (isAdmin) {
      links = adminLinks
      roleLabel = 'مدیر سیستم'
    } else if (isBuyer) {
      links = buyerLinks
      roleLabel = 'خریدار'
    } else if (isProvider) {
      links = sellerLinks
      roleLabel = 'فروشنده / ارائه‌دهنده'
    }
  } else if (isImpersonating) {
    links = user?.role === 'buyer' ? buyerLinks : sellerLinks
    roleLabel = `🔮 ${user?.role === 'buyer' ? 'خریدار' : 'فروشنده'} (جعل هویت)`
  }

  const handleLogout = () => {
    if (isImpersonating) {
      const adminData = JSON.parse(localStorage.getItem('admin_impersonate'))
      if (adminData) {
        const { adminUser, adminToken, adminRefresh } = adminData
        useAuthStore.getState().login(adminUser, adminToken, adminRefresh)
        localStorage.removeItem('admin_impersonate')
        closeSidebar()
        return
      }
    }
    logout()
    closeSidebar()
  }

  const getLinkClass = (isActive) => {
    const baseClass = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
    if (isActive) {
      return `${baseClass} bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400`
    }
    return `${baseClass} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`
  }

  return (
    <>
      {/* Overlay موبایل */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* هشدار جعل هویت */}
          {isImpersonating && (
            <div className="px-4 pt-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-full text-center">
                ⚠️ حالت جعل هویت
              </span>
            </div>
          )}

          {/* User Info - فقط در حالت لاگین نشان داده شود */}
          {isAuthenticated && !isImpersonating && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <FiUser className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.person_type === 'legal' && user?.company_name
                      ? user.company_name
                      : `${user?.first_name || ''} ${user?.last_name || ''}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon

              // اگر لینک راهنما است
              if (link.isHelp) {
                return (
                  <button
                    key={link.label}
                    onClick={link.onClick}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeSidebar}
                  className={({ isActive }) => getLinkClass(isActive)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
            {isAuthenticated && (
              <>
                <NavLink
                  to="/profile"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FiSettings className="h-5 w-5" />
                  پروفایل
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <FiLogOut className="h-5 w-5" />
                  {isImpersonating ? 'بازگشت به ادمین' : 'خروج از حساب'}
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ========== راهنمای جامع ========== */}
      <HelpCenter
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
      {/* ================================= */}
    </>
  )
}
