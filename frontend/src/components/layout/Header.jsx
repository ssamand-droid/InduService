// frontend/src/components/layout/Header.jsx - نسخه اصلاح شده نهایی
import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiSearch, FiUser, FiShoppingCart, FiMoon, FiSun, FiMenu, FiDollarSign, FiFileText, FiLogIn } from 'react-icons/fi'
import { useAuthStore } from '@stores/authStore'
import { useThemeStore } from '@stores/themeStore'
import { useUIStore } from '@stores/uiStore'
import { PROVIDER_ROLES } from '@lib/constants'
import { NotificationBell } from '@features/notifications/components/NotificationBell'
import { useCartStore } from '@features/cart/store/cartStore'
import { Sidebar } from './Sidebar'  // اضافه شد
import toast from 'react-hot-toast'

export const Header = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const login = useAuthStore((state) => state.login)

  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const openCart = useUIStore((state) => state.openCart)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)  // اضافه شد

  const navigate = useNavigate()

  const totalItems = useCartStore((state) =>
    state.items.reduce((total, item) => total + (item.quantity || 1), 0)
  )

  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    const adminData = localStorage.getItem('admin_impersonate')
    setIsImpersonating(!!adminData)
  }, [])

  const handleExitImpersonation = () => {
    try {
      const adminData = JSON.parse(localStorage.getItem('admin_impersonate'))
      if (adminData) {
        const { adminUser, adminToken, adminRefresh } = adminData
        login(adminUser, adminToken, adminRefresh)
        localStorage.removeItem('admin_impersonate')
        toast.success('به حساب ادمین بازگشتید')
        navigate('/dashboard/admin')
      }
    } catch (e) {
      localStorage.removeItem('admin_impersonate')
      logout()
      navigate('/login')
    }
  }

  const isProvider = PROVIDER_ROLES.includes(user?.role)

  const navItems = [
    { path: '/services', label: 'خدمات MRO' },
    ...(isProvider ? [] : [{ path: '/request-service', label: 'درخواست خدمت' }]),
    { path: '/products', label: 'محصولات' },
    { path: '/blog', label: 'وبلاگ' },
    { path: '/about', label: 'درباره ما' },
    { path: '/contact', label: 'تماس با ما' },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-purple-600 text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-3">
            <span>⚠️ شما در حالت جعل هویت هستید</span>
            <button onClick={handleExitImpersonation} className="underline hover:no-underline">
              بازگشت به ادمین
            </button>
          </div>
        )}

        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800">
                <FiMenu className="h-5 w-5" />
              </button>
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">InduService</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`
                  }>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="hidden lg:flex p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                <FiSearch className="h-5 w-5" />
              </button>

              {isAuthenticated && <NotificationBell />}

              <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>

              {/* فقط اگر سبد خرید خالی نیست نشان بده */}
              {totalItems > 0 && (
                <button onClick={openCart} className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                  <FiShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                </button>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                    <FiUser className="h-5 w-5" />
                    <span className="hidden md:inline text-sm font-medium">{user?.first_name || 'کاربر'}</span>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 origin-top-left rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-sm">
                        {user?.person_type === 'legal' && user?.company_name
                          ? user.company_name
                          : `${user?.first_name || ''} ${user?.last_name || ''}`}
                      </p>
                    </div>
                    <div className="p-2">
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        داشبورد
                      </Link>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        پروفایل
                      </Link>
                      {user?.role !== 'buyer' && (
                        <Link to="/wallet" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                          <FiDollarSign className="inline ml-1 h-4 w-4" /> کیف پول
                        </Link>
                      )}
                      <Link to="/invoices" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <FiFileText className="inline ml-1 h-4 w-4" /> فاکتورها
                      </Link>

                      {/* Exit Impersonation Button */}
                      {isImpersonating && (
                        <button onClick={handleExitImpersonation}
                          className="w-full text-right px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md">
                          <FiLogIn className="inline ml-1" /> بازگشت به ادمین
                        </button>
                      )}

                      <button onClick={logout} className="w-full text-right px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                        خروج
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login">
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                    ورود / ثبت‌نام
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar برای موبایل */}
      {isSidebarOpen && <Sidebar />}
    </>
  )
}