// src/features/dashboard/buyer/BuyerDashboard.jsx - نسخه نهایی با data-tour

import { Link } from 'react-router-dom'
import { FiShoppingBag, FiTool, FiClock, FiClipboard, FiPlus, FiList, FiGrid } from 'react-icons/fi'
import { Card, Spinner, Badge, Button } from '@components/ui'
import { useOrders } from '@features/orders/hooks/useOrders'
import { useServiceRequests } from '@features/services/hooks/useServices'
import { useAuthStore } from '@stores/authStore'
import { formatPrice } from '@lib/utils'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ title, value, icon: Icon, color, link, dataTour }) => (
  <Link to={link} data-tour={dataTour}>
    <Card className="flex items-center gap-4 hover:shadow-md transition-shadow h-full">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">{title}</p>
        <p className="text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
      </div>
    </Card>
  </Link>
)

export default function BuyerDashboard() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { data: ordersData, isLoading: ordersLoading } = useOrders()
  const { data: requestsData, isLoading: requestsLoading } = useServiceRequests()

  if (!isAuthenticated) {
    return null
  }

  const orders = ordersData?.results || []
  const requests = requestsData?.results || []

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length
  const pendingRequests = requests.filter(r => ['pending', 'reviewed', 'quoted'].includes(r.status)).length
  const inProgressRequests = requests.filter(r => r.status === 'in_progress').length

  if (ordersLoading || requestsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // ============================================================
  // راهنمای سریع برای خریدار (Quick Actions)
  // ============================================================
  const QuickAction = ({ icon: Icon, label, onClick, color, dataTour }) => (
    <button
      data-tour={dataTour}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-${color}-400 hover:bg-${color}-50 transition group`}
    >
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600 group-hover:bg-${color}-200 transition`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-medium text-slate-700 mt-2">{label}</span>
    </button>
  )

  return (
    <div className="space-y-6 p-6" data-tour="dashboard">
      {/* هدر با دکمه‌های اقدام سریع */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900"> داشبورد خریدار</h1>
          <p className="text-slate-500 text-sm">مدیریت دستگاه‌ها، درخواست‌ها و سفارشات خود</p>
        </div>
      </div>
      {/* ========== بخش ۲: اقدامات سریع ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction
          dataTour="assets"
          icon={FiGrid}
          label="مدیریت ماشین آلات"
          onClick={() => navigate('/dashboard/assets')}
          color="purple"
        />
        <QuickAction
          dataTour="request-service"
          icon={FiTool}
          label="درخواست خدمت جدید"
          onClick={() => navigate('/request-service')}
          color="blue"
        />
        <QuickAction
          icon={FiShoppingBag}
          label="سفارشات من"
          onClick={() => navigate('/dashboard/orders')}
          color="green"
        />
        <QuickAction
          icon={FiList}
          label="پیگیری درخواست‌ها"
          onClick={() => navigate('/dashboard/service-requests')}
          color="orange"
        />
      </div>
      {/* ========== بخش ۱: کارت‌های آمار ========== */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="دستگاه‌ها و تجهیزات"
          value={inProgressRequests}
          icon={FiTool}
          color="bg-purple-500"
          link="/dashboard/assets"
        />
        <StatCard
          title="خرید محصول"
          value={activeOrders}
          icon={FiShoppingBag}
          color="bg-blue-500"
          link="/dashboard/orders"
        />
        <StatCard
          title="درخواست‌های در انتظار"
          value={pendingRequests}
          icon={FiClock}
          color="bg-yellow-500"
          link="/dashboard/service-requests"
        />
        <StatCard
          title="کل درخواست‌های خدمت"
          value={requests.length}
          icon={FiClipboard}
          color="bg-indigo-500"
          link="/dashboard/service-requests"
        />
      </div>

      {/* ========== بخش ۳: لیست‌های اخیر ========== */}
      <div className="grid lg:grid-cols-2 gap-6" data-tour="service-requests">
        {/* سفارشات اخیر */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🛒 سفارشات اخیر</h3>
              <Link to="/dashboard/orders" className="text-blue-600 text-sm hover:underline">مشاهده همه</Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">هنوز سفارشی ثبت نکرده‌اید.</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <Link key={order.id} to={`/dashboard/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-slate-500">{order.items_count} آیتم</p>
                    </div>
                    <p className="font-medium text-blue-600">{formatPrice(order.total)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* درخواست‌های خدمت اخیر */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🔧 درخواست‌های خدمت اخیر</h3>
              <Link to="/dashboard/service-requests" className="text-blue-600 text-sm hover:underline">مشاهده همه</Link>
            </div>
            {requests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">درخواستی ثبت نشده</p>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 5).map((req) => (
                  <Link key={req.id} to={`/dashboard/service-requests/${req.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition">
                    <div>
                      <p className="font-medium text-sm">{req.title}</p>
                      <p className="text-xs text-slate-500">{req.service_title}</p>
                    </div>
                    <Badge variant={req.status === 'completed' ? 'success' : req.status === 'in_progress' ? 'info' : 'warning'} size="sm">
                      {req.status_display || req.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
            {/* ========================================================== */}
      {/* بخش ۴: ماشین‌آلات و تجهیزات */}
      {/* ========================================================== */}
      <Card data-tour="assets">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🏭 ماشین‌آلات و تجهیزات من</h3>
            <Link
              to="/dashboard/assets"
              className="text-blue-600 text-sm hover:underline"
            >
              مشاهده همه
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <FiGrid className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-xs text-slate-500">کل ماشین‌آلات و تجهیزات</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <span className="text-2xl block mb-2">✅</span>
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-xs text-slate-500">فعال</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <span className="text-2xl block mb-2">⚠️</span>
              <p className="text-2xl font-bold text-yellow-600">0</p>
              <p className="text-xs text-slate-500">نیاز به توجه</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <span className="text-2xl block mb-2">🔴</span>
              <p className="text-2xl font-bold text-red-600">0</p>
              <p className="text-xs text-slate-500">اضطراری</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
