// frontend/src/pages/AdminDashboardPage.jsx - نسخه ساده
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FiUsers, FiShoppingBag, FiTool, FiDollarSign,
  FiActivity, FiPackage, FiSettings,
  FiFileText, FiBarChart2, FiAlertCircle
} from 'react-icons/fi'
import api from '@lib/axios'
import { formatPrice } from '@lib/utils'

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/admin-dashboard/').then(res => res.data),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  if (error) return <div className="p-8 text-center text-red-500">خطا در دریافت اطلاعات</div>
  if (!data) return null

  const quickLinks = [
    { to: '/dashboard/admin/users', icon: FiUsers, label: 'مدیریت کاربران', color: 'bg-blue-500' },
    { to: '/dashboard/admin/orders', icon: FiShoppingBag, label: 'مدیریت سفارشات', color: 'bg-orange-500' },
    { to: '/dashboard/admin/services', icon: FiTool, label: 'مدیریت خدمات', color: 'bg-purple-500' },
    { to: '/dashboard/admin/products', icon: FiPackage, label: 'مدیریت محصولات', color: 'bg-green-500' },
    { to: '/dashboard/admin/finance', icon: FiDollarSign, label: 'مدیریت مالی', color: 'bg-emerald-500' },
    { to: '/dashboard/admin/settings', icon: FiSettings, label: 'تنظیمات پلتفرم', color: 'bg-gray-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {new Date().toLocaleDateString('fa-IR')}
        </span>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500">
            <FiUsers className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">کل کاربران</p>
            <p className="text-xl font-bold">{data.users.total}</p>
            <p className="text-xs text-gray-400 mt-1">{data.users.new_this_week} جدید این هفته</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-orange-500">
            <FiShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">سفارشات فعال</p>
            <p className="text-xl font-bold">{data.orders.pending + data.orders.confirmed + data.orders.processing}</p>
            <p className="text-xs text-gray-400 mt-1">{data.orders.pending} در انتظار</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500">
            <FiTool className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">درخواست‌های خدمت</p>
            <p className="text-xl font-bold">{data.service_requests.pending}</p>
            <p className="text-xs text-gray-400 mt-1">{data.service_requests.total} کل</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-500">
            <FiDollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">درآمد ماه</p>
            <p className="text-xl font-bold">{formatPrice(data.finance.paid_this_month)}</p>
            <p className="text-xs text-gray-400 mt-1">کمیسیون: {formatPrice(data.finance.commission_this_month)}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FiActivity className="text-blue-600" /> دسترسی سریع
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.to} to={link.to} className="text-center p-3 rounded-lg hover:bg-gray-50 transition">
                <div className={`p-2 rounded-lg ${link.color} inline-flex mb-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-medium">{link.label}</p>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" /> وضعیت سفارشات
          </h3>
          <div className="space-y-2">
            {data.charts.orders_by_status.map((item) => {
              const labels = { pending: 'در انتظار', confirmed: 'تایید شده', processing: 'در حال انجام', shipped: 'ارسال شده', completed: 'تکمیل', cancelled: 'لغو' }
              const total = data.orders.total || 1
              const percent = Math.round((item.count / total) * 100)
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-600">{labels[item.status]}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Service Requests Chart */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-blue-600" /> وضعیت درخواست‌های خدمت
          </h3>
          <div className="space-y-2">
            {data.charts.requests_by_status.map((item) => {
              const labels = { pending: 'در انتظار', reviewed: 'بررسی شده', quoted: 'قیمت داده شده', accepted: 'پذیرفته شده', in_progress: 'در حال انجام', completed: 'تکمیل', cancelled: 'لغو' }
              const total = data.service_requests.total || 1
              const percent = Math.round((item.count / total) * 100)
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-600">{labels[item.status]}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FiActivity className="text-blue-600" /> فعالیت‌های اخیر
        </h3>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {data.recent_activity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <span>{activity.message}</span>
              <span className="text-xs text-gray-500">
                {new Date(activity.date).toLocaleString('fa-IR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}