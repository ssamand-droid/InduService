import React, { useState, useEffect } from 'react';
import { 
  BarChart3, AlertTriangle, Clock, Wrench, 
  Activity, Plus, ChevronRight, Zap, Package 
} from 'lucide-react';
import assetService from '../services/assetService';
import AssetCard from './AssetCard';
import AlertPanel from './AlertPanel';
import CreateAssetModal from './CreateAssetModal';

const AssetDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // به‌روزرسانی هر ۳۰ ثانیه
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await assetService.getGlobalDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const healthColor = (value) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* هدر */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            اتاق فرمان دارایی‌ها
          </h1>
          <p className="text-gray-500 mt-2">
            سلامت کلی: {' '}
            <span className={`font-bold text-lg ${healthColor(dashboardData.average_health)}`}>
              {dashboardData.average_health?.toFixed(1)}%
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          افزودن دستگاه جدید
        </button>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Activity className="text-blue-500" />}
          title="کل دارایی‌ها"
          value={dashboardData.total_assets}
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={<AlertTriangle className="text-red-500" />}
          title="هشدارهای بحرانی"
          value={dashboardData.critical_alerts}
          bgColor="bg-red-50"
          pulse={dashboardData.critical_alerts > 0}
        />
        <StatCard 
          icon={<Clock className="text-yellow-500" />}
          title="نگهداری پیش رو (۷ روز)"
          value={dashboardData.upcoming_maintenance}
          bgColor="bg-yellow-50"
        />
        <StatCard 
          icon={<Zap className="text-green-500" />}
          title="در حال کار"
          value={dashboardData.assets_by_status?.operational || 0}
          bgColor="bg-green-50"
        />
      </div>

      {/* وضعیت‌های دارایی‌ها */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">وضعیت دارایی‌ها</h2>
        <div className="flex gap-4">
          <StatusBadge 
            label="عملیاتی" 
            count={dashboardData.assets_by_status?.operational} 
            color="bg-green-100 text-green-800" 
          />
          <StatusBadge 
            label="کاهش عملکرد" 
            count={dashboardData.assets_by_status?.degraded} 
            color="bg-yellow-100 text-yellow-800" 
          />
          <StatusBadge 
            label="در دست تعمیر" 
            count={dashboardData.assets_by_status?.maintenance} 
            color="bg-red-100 text-red-800" 
          />
        </div>
      </div>

      {/* دارایی‌های نیازمند توجه */}
      {dashboardData.assets_needing_attention?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="text-orange-500" />
            نیازمند توجه فوری
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.assets_needing_attention.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      )}

      {/* مودال ایجاد دارایی */}
      {showCreateModal && (
        <CreateAssetModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, bgColor, pulse }) => (
  <div className={`${bgColor} rounded-xl p-6 shadow-sm relative overflow-hidden`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value || 0}</p>
      </div>
      <div className={`${pulse ? 'animate-pulse' : ''}`}>
        {icon}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ label, count, color }) => (
  <div className={`px-4 py-2 rounded-lg ${color} flex items-center gap-2`}>
    <span className="font-bold text-lg">{count || 0}</span>
    <span className="text-sm">{label}</span>
  </div>
);

export default AssetDashboard;