// InduService\frontend\src\routes\router.jsx
import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@components/layout/MainLayout'
import { DashboardLayout } from '@components/layout/DashboardLayout'
import { ProviderOnboardingWizard } from '@features/provider';
import { PrivateRoute } from './PrivateRoute'

// Lazy load pages
import { lazy, Suspense } from 'react'
import { Spinner } from '@components/ui'

import { BUYER_ROLES, PROVIDER_ROLES } from '@lib/constants'


// ==================== صفحات عمومی ====================
const HomePage = lazy(() => import('@pages/HomePage'))
const ProductsPage = lazy(() => import('@pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@pages/ProductDetailPage'))
const ServicesPage = lazy(() => import('@pages/ServicesPage'))
const ServiceDetailPage = lazy(() => import('@pages/ServiceDetailPage'))
const CartPage = lazy(() => import('@pages/CartPage'))
const CheckoutPage = lazy(() => import('@pages/CheckoutPage'))
const DashboardPage = lazy(() => import('@pages/DashboardPage'))
const LoginPage = lazy(() => import('@pages/LoginPage'))
const RegisterPage = lazy(() => import('@pages/RegisterPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))
const RequestServicePage = lazy(() => import('@pages/RequestServicePage'))
const OrderDetailPage = lazy(() => import('@pages/OrderDetailPage'))
const NotificationsPage = lazy(() => import('@pages/NotificationsPage'))
const ContractDetailPage = lazy(() => import('@pages/ContractDetailPage'))
const TermsPage = lazy(() => import('@pages/TermsPage'))
const PrivacyPage = lazy(() => import('@pages/PrivacyPage'))
const ProfilePage = lazy(() => import('@pages/ProfilePage'))
const AboutPage = lazy(() => import('@pages/AboutPage'))
const ContactPage = lazy(() => import('@pages/ContactPage'))
const BlogPage = lazy(() => import('@pages/BlogPage'))
const BlogDetailPage = lazy(() => import('@pages/BlogDetailPage'))
const DemoPage = lazy(() => import('@pages/DemoPage'))

const PricingPage = lazy(() => import('@pages/PricingPage'))
const SubscriptionPage = lazy(() => import('@pages/SubscriptionPage'))

// صفحات داشبورد ادمین
const AdminDashboardPage = lazy(() => import('@pages/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@pages/AdminUsersPage'))
const AdminSettingsPage = lazy(() => import('@pages/AdminSettingsPage'))
const AdminOrdersPage = lazy(() => import('@pages/AdminOrdersPage'))
const AdminServicesPage = lazy(() => import('@pages/AdminServicesPage'))
const AdminProductsPage = lazy(() => import('@pages/AdminProductsPage'))
const AdminFinancePage = lazy(() => import('@pages/AdminFinancePage'))
const AdminBlogPage = lazy(() => import('@pages/AdminBlogPage'))
const AdminCommissionPage = lazy(() => import('@pages/AdminCommissionPage'))
const AdminServiceRequestsPage = lazy(() => import('@pages/AdminServiceRequestsPage'))
const AdminServiceRequestDetailPage = lazy(() => import('@pages/AdminServiceRequestDetailPage'))

const WalletPage = lazy(() => import('@pages/WalletPage'))
const InvoicesPage = lazy(() => import('@pages/InvoicesPage'))
const SettlementPage = lazy(() => import('@pages/SettlementPage'))

// صفحات داشبورد خریدار
const BuyerDashboard = lazy(() => import('@features/dashboard/buyer/BuyerDashboard'))
const MyOrders = lazy(() => import('@features/dashboard/buyer/MyOrders'))
const MyServiceRequests = lazy(() => import('@features/dashboard/buyer/MyServiceRequests'))

// صفحات داشبورد فروشنده
const SellerDashboard = lazy(() => import('@features/dashboard/seller/SellerDashboard'))
const MyProducts = lazy(() => import('@features/dashboard/seller/MyProducts'))
const MyServices = lazy(() => import('@features/dashboard/seller/MyServices'))
const ManageOrders = lazy(() => import('@features/dashboard/seller/ManageOrders'))
const ProductForm = lazy(() => import('@features/dashboard/seller/ProductForm'))
const ServiceForm = lazy(() => import('@features/dashboard/seller/ServiceForm'))
const ServiceRequestDetailPage = lazy(() => import('@pages/ServiceRequestDetailPage'))

// ==================== صفحات Asset Management ====================
const AssetsPage = lazy(() => import('@pages/AssetsPage'))
const AddAssetPage = lazy(() => import('@pages/AddAssetPage'))
const AssetDetailPage = lazy(() => import('@pages/AssetDetailPage'))
const ImportAssetsPage = lazy(() => import('@pages/ImportAssetsPage'))
const AssetDashboardPage = lazy(() => import('@pages/AssetDashboardPage'))
const EditAssetPage = lazy(() => import('@pages/EditAssetPage'))
const AssetSensorsPage = lazy(() => import('@pages/AssetSensorsPage'))

const AdminSupportPage = lazy(() => import('@pages/AdminSupportPage'))
const SupportPage = lazy(() => import('@pages/SupportPage'))
const SupportTicketDetailPage = lazy(() => import('@pages/SupportTicketDetailPage'))

/**
 * کامپوننت LazyLoad برای نمایش اسپینر حین بارگذاری صفحات
 */
const LazyLoad = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }
  >
    {children}
  </Suspense>
)

/**
 * روتر اصلی برنامه
 */
export const router = createBrowserRouter([
  // ==================== صفحات عمومی ====================
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <LazyLoad><HomePage /></LazyLoad> },
      { path: 'products', element: <LazyLoad><ProductsPage /></LazyLoad> },
      { path: 'products/:slug', element: <LazyLoad><ProductDetailPage /></LazyLoad> },
      { path: 'services', element: <LazyLoad><ServicesPage /></LazyLoad> },
      { path: 'services/:slug', element: <LazyLoad><ServiceDetailPage /></LazyLoad> },
      { path: 'cart', element: <LazyLoad><CartPage /></LazyLoad> },
      { path: 'request-service', element: <LazyLoad><RequestServicePage /></LazyLoad> },
      { path: 'terms', element: <LazyLoad><TermsPage /></LazyLoad> },
      { path: 'privacy', element: <LazyLoad><PrivacyPage /></LazyLoad> },
      { path: 'profile', element: <LazyLoad><ProfilePage /></LazyLoad> },
      { path: 'about', element: <LazyLoad><AboutPage /></LazyLoad> },
      { path: 'contact', element: <LazyLoad><ContactPage /></LazyLoad> },
      { path: 'blog', element: <LazyLoad><BlogPage /></LazyLoad> },
      { path: 'blog/:slug', element: <LazyLoad><BlogDetailPage /></LazyLoad> },
      { path: 'wallet', element: <LazyLoad><WalletPage /></LazyLoad> },
      { path: 'invoices', element: <LazyLoad><InvoicesPage /></LazyLoad> },
      { path: 'settlement', element: <LazyLoad><SettlementPage /></LazyLoad> },
      { path: 'pricing', element: <LazyLoad><PricingPage /></LazyLoad> },
      { path: '/demo', element: <LazyLoad><DemoPage /></LazyLoad> },
      // ========== حذف شد (به داشبورد منتقل شد) ==========
      // { 
      //   path: 'provider/onboarding', 
      //   element: <PrivateRoute><LazyLoad><ProviderOnboardingWizard /></LazyLoad></PrivateRoute> 
      // },
      // ===================================================
    ],
  },

  // ==================== صفحات Auth ====================
  {
    path: '/login',
    element: <LazyLoad><LoginPage /></LazyLoad>,
  },
  {
    path: '/register',
    element: <LazyLoad><RegisterPage /></LazyLoad>,
  },

  // ==================== صفحات Checkout (نیاز به لاگین) ====================
  {
    path: '/checkout',
    element: <PrivateRoute />,
    children: [
      { index: true, element: <LazyLoad><CheckoutPage /></LazyLoad> },
    ],
  },

  // ==================== اعلان‌ها (نیاز به لاگین) - قرار دادن قبل از dashboard برای اولویت ====================
  {
    path: '/notifications',
    element: <PrivateRoute />,
    children: [
      { index: true, element: <LazyLoad><NotificationsPage /></LazyLoad> },
    ],
  },


  // ==================== صفحات داشبورد ====================
  {
    path: '/dashboard',
    element: <PrivateRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <LazyLoad><DashboardPage /></LazyLoad>,
          },

          // ========== مسیرهای پشتیبانی (کاربر عادی) ==========
          {
            path: 'support',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><SupportPage /></LazyLoad> },
              { path: 'tickets/:id', element: <LazyLoad><SupportTicketDetailPage /></LazyLoad> },
            ],
          },

          // ========== مسیرهای پشتیبانی (ادمین) ==========
          {
            path: 'admin/support',
            element: <PrivateRoute allowedRoles={['admin']} />,
            children: [
              { index: true, element: <LazyLoad><AdminSupportPage /></LazyLoad> },
              { path: 'tickets/:id', element: <LazyLoad><SupportTicketDetailPage /></LazyLoad> },
            ],
          },

          // ========== مسیرهای دریافت‌کننده ==========
          {
            path: 'orders',
            element: <PrivateRoute allowedRoles={BUYER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><MyOrders /></LazyLoad> },
              { path: ':id', element: <LazyLoad><OrderDetailPage /></LazyLoad> },
            ],
          },
          {
            path: 'orders/:id',
            element: <PrivateRoute allowedRoles={BUYER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><OrderDetailPage /></LazyLoad> },
            ],
          },
          {
            path: 'service-requests',
            element: <PrivateRoute allowedRoles={[...BUYER_ROLES, ...PROVIDER_ROLES]} />,
            children: [
              { index: true, element: <LazyLoad><MyServiceRequests /></LazyLoad> },
            ],
          },

          // ========== مسیرهای دارایی‌ها ==========
          {
            path: 'assets',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><AssetsPage /></LazyLoad> },
            ],
          },
          {
            path: 'assets/:id/edit',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><EditAssetPage /></LazyLoad> },
            ],
          },
          {
            path: 'assets/:id',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><AssetDetailPage /></LazyLoad> },
            ],
          },
          {
            path: 'assets/new',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><AddAssetPage /></LazyLoad> },
            ],
          },
          {
            path: 'assets/:id/dashboard',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><AssetDashboardPage /></LazyLoad> },
            ],
          },
          {
            path: 'import-assets',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><ImportAssetsPage /></LazyLoad> },
            ],
          },
          {
            path: 'assets/:id/sensors',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><AssetSensorsPage /></LazyLoad> },
            ],
          },
          {
            path: 'subscription',
            element: <PrivateRoute />,
            children: [
              { index: true, element: <LazyLoad><SubscriptionPage /></LazyLoad> },
            ],
          },

          // ========== مسیرهای خدمات‌دهنده ==========
          {
            path: 'products',
            element: <PrivateRoute allowedRoles={PROVIDER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><MyProducts /></LazyLoad> },
            ],
          },
          {
            path: 'products/new',
            element: <PrivateRoute allowedRoles={PROVIDER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><ProductForm /></LazyLoad> },
            ],
          },
          {
            path: 'products/:slug/edit',
            element: <PrivateRoute allowedRoles={[...PROVIDER_ROLES, 'admin']} />,
            children: [
              { index: true, element: <LazyLoad><ProductForm /></LazyLoad> },
            ],
          },
          {
            path: 'services',
            element: <PrivateRoute allowedRoles={PROVIDER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><MyServices /></LazyLoad> },
            ],
          },
          {
            path: 'services/new',
            element: <PrivateRoute allowedRoles={PROVIDER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><ServiceForm /></LazyLoad> },
            ],
          },
          {
            path: 'services/:slug/edit',
            element: <PrivateRoute allowedRoles={[...PROVIDER_ROLES, 'admin']} />,
            children: [
              { index: true, element: <LazyLoad><ServiceForm /></LazyLoad> },
            ],
          },
          {
            path: 'service-requests/:id',
            element: <PrivateRoute allowedRoles={[...BUYER_ROLES, ...PROVIDER_ROLES]} />,
            children: [
              { index: true, element: <LazyLoad><ServiceRequestDetailPage /></LazyLoad> },
            ],
          },
          {
            path: 'manage-orders',
            element: <PrivateRoute allowedRoles={PROVIDER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><ManageOrders /></LazyLoad> },
            ],
          },
          {
            path: 'manage-orders/:id',
            element: <PrivateRoute allowedRoles={PROVIDER_ROLES} />,
            children: [
              { index: true, element: <LazyLoad><OrderDetailPage /></LazyLoad> },
            ],
          },
          // ========== مسیرهای ادمین ==========
          {
            path: 'admin',
            element: <PrivateRoute allowedRoles={['admin']} />,
            children: [
              { index: true, element: <LazyLoad><AdminDashboardPage /></LazyLoad> },
              { path: 'users', element: <LazyLoad><AdminUsersPage /></LazyLoad> },
              { path: 'orders', element: <LazyLoad><AdminOrdersPage /></LazyLoad> },
              { path: 'services', element: <LazyLoad><AdminServicesPage /></LazyLoad> },
              { path: 'products', element: <LazyLoad><AdminProductsPage /></LazyLoad> },
              { path: 'finance', element: <LazyLoad><AdminFinancePage /></LazyLoad> },
              { path: 'blog', element: <LazyLoad><AdminBlogPage /></LazyLoad> },
              { path: 'settings', element: <LazyLoad><AdminSettingsPage /></LazyLoad> },
              { path: 'commission', element: <LazyLoad><AdminCommissionPage /></LazyLoad> },
              {
                path: 'support',
                element: <PrivateRoute allowedRoles={['admin']} />,
                children: [
                  { index: true, element: <LazyLoad><AdminSupportPage /></LazyLoad> },
                  { path: 'tickets/:id', element: <LazyLoad><SupportTicketDetailPage /></LazyLoad> },
                ],
              },
              {
                path: 'service-requests',
                element: <PrivateRoute allowedRoles={['admin']} />,
                children: [
                  { index: true, element: <LazyLoad><AdminServiceRequestsPage /></LazyLoad> },
                  { path: ':id', element: <LazyLoad><AdminServiceRequestDetailPage /></LazyLoad> },
                ],
              },
            ],
          },

          // ========== اضافه شده ==========
          // مسیر تکمیل پروفایل خدمات‌دهنده
          {
            path: 'provider/onboarding',
            element: <LazyLoad><ProviderOnboardingWizard /></LazyLoad>
          },
          // ================================
        ],
      },
    ],
  },

  // ==================== قراردادها ====================
  {
    path: '/contracts/:id',
    element: <PrivateRoute />,
    children: [
      { index: true, element: <LazyLoad><ContractDetailPage /></LazyLoad> },
    ],
  },

  // ==================== 404 (آخرین مسیر) ====================
  {
    path: '*',
    element: <LazyLoad><NotFoundPage /></LazyLoad>,
  },
])