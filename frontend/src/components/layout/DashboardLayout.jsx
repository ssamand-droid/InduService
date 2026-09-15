// src/components/layout/DashboardLayout.jsx
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export const DashboardLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex flex-1 overflow-hidden relative"> {/* مهم */}
        <Sidebar />

        {/* Main Content - با مدیریت فضای sidebar در موبایل */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:pr-6 transition-all duration-300">
          <div className="max-w-full"> {/* جلوگیری از بیرون زدن */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}