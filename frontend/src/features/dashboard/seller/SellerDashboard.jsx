// src/features/dashboard/seller/SellerDashboard.jsx - نسخه کامل با بخش محصولات

import { Link } from "react-router-dom";
import {
  FiPackage,
  FiTool,
  FiShoppingBag,
  FiDollarSign,
  FiClipboard,
  FiPlus,
  FiList,
  FiBriefcase,
  FiAward,
  FiGrid,
  FiUsers,
} from "react-icons/fi";
import { Card, Spinner, Badge, Button } from "@components/ui";
import { useMyProducts } from "@features/products/hooks/useProducts";
import { useMyServices } from "@features/services/hooks/useServices";
import { useOrders } from "@features/orders/hooks/useOrders";
import { useServiceRequests } from "@features/services/hooks/useServices";
import { useAuthStore } from "@stores/authStore";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@lib/utils";
import { ORDER_STATUS_LABELS } from "@lib/constants";

// ============================================================
// کامپوننت‌های کمکی
// ============================================================

const StatCard = ({ title, value, icon: Icon, color, link, dataTour }) => (
  <Link to={link} data-tour={dataTour}>
    <Card className="flex items-center gap-4 hover:shadow-md transition-shadow h-full">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-secondary-900 dark:text-white">
          {value}
        </p>
      </div>
    </Card>
  </Link>
);

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
  color,
  dataTour,
  badge,
}) => (
  <button
    data-tour={dataTour}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-${color}-400 hover:bg-${color}-50 transition group relative`}
  >
    <div
      className={`p-3 rounded-full bg-${color}-100 text-${color}-600 group-hover:bg-${color}-200 transition`}
    >
      <Icon className="h-6 w-6" />
    </div>
    <span className="text-sm font-medium text-slate-700 mt-2">{label}</span>
    {badge && (
      <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
        {badge}
      </span>
    )}
  </button>
);

// ============================================================
// کامپوننت اصلی
// ============================================================

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { data: productsData, isLoading: productsLoading } = useMyProducts();
  const { data: servicesData, isLoading: servicesLoading } = useMyServices();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: requestsData, isLoading: requestsLoading } =
    useServiceRequests();

  if (!isAuthenticated) {
    return null;
  }

  const products = productsData?.results || [];
  const services = servicesData?.results || [];
  const orders = ordersData?.results || [];
  const requests = requestsData?.results || [];

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const activeRequests = requests.filter((r) =>
    ["accepted", "in_progress"].includes(r.status),
  ).length;

  // تشخیص نوع کاربر
  const isSeller = user?.role === "seller" || user?.role === "company_seller";
  const isServiceProvider =
    user?.role === "service_provider" || user?.role === "company_provider";

  if (productsLoading || servicesLoading || ordersLoading || requestsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-tour="dashboard">
      {/* ========================================================== */}
      {/* هدر */}
      {/* ========================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">داشبورد</h1>
          <p className="text-slate-500 text-sm">
            {isServiceProvider &&
              isSeller &&
              "ارائه‌دهنده خدمت و فروشنده محصول"}
            {isServiceProvider && !isSeller && "ارائه‌دهنده خدمت"}
            {!isServiceProvider && isSeller && "فروشنده محصول"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* {isServiceProvider && (
            <Button
              data-tour="services"
              variant="primary"
              onClick={() => navigate("/dashboard/services/new")}
              className="flex items-center gap-2"
            >
              <FiPlus size={16} /> ثبت خدمت جدید
            </Button>
          )} */}
          {isSeller && (
            <Button
              data-tour="products"
              variant="secondary"
              onClick={() => navigate("/dashboard/products/new")}
              className="flex items-center gap-2"
            >
              <FiPlus size={16} /> ثبت محصول جدید
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <FiTool className="text-green-600" />
        <h2 className="text-lg font-semibold text-slate-800">بخش خدمات</h2>
        <Badge
          variant="success"
          size="sm"
          className="bg-green-100 text-green-700"
        >
          تخصصی
        </Badge>
      </div>
      {/* ========================================================== */}
      {/* بخش خدمت قدامات سریع */}
      {/* ========================================================== */}
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          اقدامات سریع
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {isServiceProvider && (
            <QuickAction
              dataTour="profile"
              icon={FiBriefcase}
              label="تکمیل پروفایل"
              onClick={() => navigate("/profile")}
              color="purple"
            />
          )}

          {isServiceProvider && (
            <QuickAction
              dataTour="services"
              icon={FiTool}
              label="ثبت خدمت جدید"
              onClick={() => navigate("/dashboard/services/new")}
              color="green"
            />
          )}

          {isServiceProvider && (
            <QuickAction
              dataTour="portfolio"
              icon={FiAward}
              label="نمونه کارها"
              onClick={() => navigate("/profile")}
              color="pink"
            />
          )}
          {/* گام ۳: مشاهده درخواست‌ها */}
          <QuickAction
            dataTour="service-requests"
            icon={FiList}
            label="درخواست‌های خدمت"
            onClick={() => navigate("/dashboard/service-requests")}
            color="orange"
            badge={pendingRequests > 0 ? pendingRequests : null}
          />
        </div>
      </div>
      {/* بخش خدمات */}
      {isServiceProvider && (
        <div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              dataTour="services"
              title="خدمات من"
              value={services.length}
              icon={FiTool}
              color="bg-green-500"
              link="/dashboard/services"
            />
            <StatCard
              title="درخواست‌های جدید"
              value={pendingRequests}
              icon={FiClipboard}
              color="bg-purple-500"
              link="/dashboard/service-requests"
            />
            <StatCard
              title="خدمات در حال انجام"
              value={activeRequests}
              icon={FiDollarSign}
              color="bg-indigo-500"
              link="/dashboard/service-requests"
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <FiPackage className="text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">
          بخش محصولات و فروش
        </h2>
        <Badge variant="info" size="sm" className="bg-blue-100 text-blue-700">
          بازرگانی
        </Badge>
      </div>
      {/* ========================================================== */}
      {/* بخش محصولقدامات سریع */}
      {/* ========================================================== */}
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">
          اقدامات سریع
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <QuickAction
            dataTour="products"
            icon={FiPackage}
            label="ثبت محصول جدید"
            onClick={() => navigate("/dashboard/products/new")}
            color="blue"
          />

          <QuickAction
            dataTour="manage-orders"
            icon={FiShoppingBag}
            label="مدیریت سفارشات"
            onClick={() => navigate("/dashboard/manage-orders")}
            color="yellow"
            badge={pendingOrders > 0 ? pendingOrders : null}
          />
        </div>
      </div>
      {/* ========================================================== */}
      {/* بخش محصولات و فروش — حتماً نمایش داده شود */}
      {/* ========================================================== */}
      <div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            dataTour={isSeller ? "products" : undefined}
            title="محصولات من"
            value={products.length}
            icon={FiPackage}
            color="bg-blue-500"
            link="/dashboard/products"
          />
          <StatCard
            title="سفارشات در انتظار"
            value={pendingOrders}
            icon={FiShoppingBag}
            color="bg-yellow-500"
            link="/dashboard/manage-orders"
          />
          <StatCard
            title="کل سفارشات"
            value={orders.length}
            icon={FiShoppingBag}
            color="bg-orange-500"
            link="/dashboard/manage-orders"
          />
        </div>
      </div>

      {/* ========================================================== */}
      {/* بخش ۳: لیست‌های اخیر */}
      {/* ========================================================== */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* سفارشات اخیر */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold"> سفارشات اخیر</h3>
              <Link
                to="/dashboard/manage-orders"
                className="text-blue-600 text-sm hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                هنوز سفارشی دریافت نکرده‌اید.
              </p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    to={`/dashboard/manage-orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-slate-500">
                        خریدار: {order.buyer_name}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-blue-600">
                        {formatPrice(order.total)}
                      </p>
                      <Badge
                        variant={
                          order.status === "pending" ? "warning" : "info"
                        }
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* درخواست‌های خدمت اخیر */}
        <Card data-tour="service-requests">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">درخواست‌های خدمت</h3>
              <Link
                to="/dashboard/service-requests"
                className="text-blue-600 text-sm hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
            {requests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                هیچ درخواست خدمتی ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 5).map((req) => (
                  <Link
                    key={req.id}
                    to={`/dashboard/service-requests/${req.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div>
                      <p className="font-medium text-sm">{req.title}</p>
                      <p className="text-xs text-slate-500">
                        از: {req.buyer_name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        req.status === "pending"
                          ? "warning"
                          : req.status === "completed"
                            ? "success"
                            : "info"
                      }
                      size="sm"
                    >
                      {req.status_display || req.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
