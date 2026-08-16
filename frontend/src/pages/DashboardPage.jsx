// src/pages/DashboardPage.jsx - نسخه نهایی با OnboardingGuide

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui';
import { lazy, Suspense } from 'react';
import { BUYER_ROLES, PROVIDER_ROLES } from '@lib/constants';
import { FiGrid } from 'react-icons/fi';

// ========== اضافه شده ==========
import { OnboardingGuide, ProfileIncompleteBanner } from '@components/provider';
// ================================

const LoadingDashboard = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">در حال بارگذاری داشبورد...</p>
    </div>
  </div>
);

const BuyerDashboard = lazy(() => import('@features/dashboard/buyer/BuyerDashboard'));
const SellerDashboard = lazy(() => import('@features/dashboard/seller/SellerDashboard'));

function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // دیباگ - برای بررسی وضعیت
  console.log('DashboardPage - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.role);

  // حالت لودینگ
  if (isLoading) return <LoadingDashboard />;
  
  // عدم احراز هویت - مهمترین شرط
  if (!isAuthenticated || !user) {
    console.log('DashboardPage - Redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // ========== بررسی نقش کاربر ==========
  const isProvider = PROVIDER_ROLES.includes(user.role);
  const isBuyer = BUYER_ROLES.includes(user.role);

  // ========== رندر محتوای داشبورد ==========
  const renderDashboardContent = () => {
    if (isBuyer) {
      console.log('DashboardPage - Rendering BuyerDashboard');
      return (
        <Suspense fallback={<LoadingDashboard />}>
          <BuyerDashboard />
        </Suspense>
      );
    }

    if (isProvider) {
      console.log('DashboardPage - Rendering SellerDashboard');
      return (
        <Suspense fallback={<LoadingDashboard />}>
          {/* ========== اضافه شده: راهنما و بنر ========== */}
          <div className="relative">
            {/* راهنمای گام‌ها (فقط برای کاربران جدید) */}
            <OnboardingGuide />
            
            {/* بنر تکمیل پروفایل */}
            <ProfileIncompleteBanner />
            
            {/* محتوای اصلی داشبورد فروشنده */}
            <SellerDashboard />
          </div>
          {/* ========================================== */}
        </Suspense>
      );
    }

    if (user.role === 'admin' || user.is_staff) {
      console.log('DashboardPage - Redirecting to admin');
      return <Navigate to="/dashboard/admin" replace />;
    }

    console.log('DashboardPage - No role matched, redirecting to home');
    return <Navigate to="/" replace />;
  };

  return renderDashboardContent();
}

export default DashboardPage;

// ============================================
// کامپوننت‌های کمکی برای استفاده در داشبوردهای فرزند
// ============================================

// کامپوننت نقش کاربری
export const RoleBadge = ({ role }) => {
  const roleInfo = {
    buyer: { label: 'خریدار', icon: '🛒', color: 'blue' },
    seller: { label: 'ارائه‌دهنده خدمت', icon: '🔧', color: 'green' },
    admin: { label: 'مدیر سیستم', icon: '👑', color: 'purple' },
  };
  
  const info = roleInfo[role] || { label: role, icon: '👤', color: 'gray' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-${info.color}-50 text-${info.color}-700 rounded-full text-xs font-medium`}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
};

// هدر مشترک داشبورد
export const DashboardHeader = ({ title, subtitle, user, actions }) => {
  return (
    <div  data-tour="dashboard" className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="container-custom py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FiGrid className="text-blue-600 h-6 w-6" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{title}</h1>
            </div>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>
          
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
          
          {user && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2">
              {user.profile?.avatar ? (
                <img 
                  src={user.profile.avatar} 
                  alt={user.full_name} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
              )}
              <div>
                <p className="font-medium text-slate-800 text-sm">{user.full_name}</p>
                <RoleBadge role={user.role === 'buyer' ? 'buyer' : (user.role === 'seller' ? 'seller' : 'admin')} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// کارت آمار در داشبورد
export const StatsCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'} bg-${trend.positive ? 'green' : 'red'}-50 px-2 py-1 rounded-full`}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{value}</h3>
      <p className="text-slate-500 text-sm mt-1">{title}</p>
    </div>
  );
};

// منوی کناری داشبورد
export const DashboardSidebar = ({ menuItems, activeItem, onItemClick }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-24">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-800">منوی اصلی</h3>
      </div>
      <nav className="p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-sm">{item.label}</span>
              {item.badge && (
                <span className="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// جدول داده‌ها در داشبورد
export const DashboardTable = ({ columns, data, loading, onRowClick }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl">
        <div className="text-5xl mb-3">📋</div>
        <p className="text-slate-500">هیچ داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-slate-50 transition ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-slate-700">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// کارت وظایف
export const TaskCard = ({ title, description, dueDate, status, onAction }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  
  const statusLabels = {
    pending: 'در انتظار',
    in_progress: 'در حال انجام',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
  };
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-slate-800">{title}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status] || statusColors.pending}`}>
          {statusLabels[status] || status}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-3">{description}</p>
      {dueDate && (
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <span>📅</span> {dueDate}
        </p>
      )}
      {onAction && (
        <button
          onClick={onAction}
          className="w-full mt-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
        >
          مشاهده جزئیات
        </button>
      )}
    </div>
  );
};

// کارت اعلانات
export const NotificationCard = ({ title, message, time, isRead, onMarkAsRead }) => {
  return (
    <div className={`p-4 rounded-xl border transition ${isRead ? 'bg-white border-slate-200' : 'bg-blue-50/30 border-blue-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${isRead ? 'bg-slate-300' : 'bg-blue-600'}`} />
        <div className="flex-1">
          <h4 className="font-medium text-slate-800 text-sm">{title}</h4>
          <p className="text-slate-500 text-xs mt-1">{message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">{time}</span>
            {!isRead && onMarkAsRead && (
              <button onClick={onMarkAsRead} className="text-xs text-blue-600 hover:underline">
                خوانده شده
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};