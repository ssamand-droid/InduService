import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Activity, MapPin, Calendar, DollarSign, 
  AlertTriangle, Settings, Camera, FileText,
  Thermometer, Wind 
} from 'lucide-react';
import assetService from '../services/assetService';
import HealthGauge from './ui/HealthGauge';
import MaintenanceTimeline from './MaintenanceTimeline';
import PartsInventory from './PartsInventory';
import HotspotImage from './HotspotImage';

const AssetDetail = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAssetData();
  }, [id]);

  const fetchAssetData = async () => {
    try {
      const [assetRes, dashboardRes] = await Promise.all([
        assetService.getAsset(id),
        assetService.getAssetDashboard(id)
      ]);
      setAsset(assetRes.data);
      setDashboard(dashboardRes.data);
    } catch (error) {
      console.error('Error fetching asset:', error);
    }
  };

  if (!asset) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  const healthColor = asset.health_index >= 80 ? 'green' : 
                      asset.health_index >= 60 ? 'yellow' : 'red';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* هدر دستگاه */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <HealthGauge value={asset.health_index} color={healthColor} size="lg" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{asset.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  asset.status === 'operational' ? 'bg-green-100 text-green-700' :
                  asset.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {asset.status === 'operational' ? 'در حال کار' :
                   asset.status === 'degraded' ? 'کاهش عملکرد' : 'در دست تعمیر'}
                </span>
              </div>
              <div className="flex gap-4 text-gray-500 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {asset.location || 'بدون موقعیت'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} /> نصب: {asset.installation_date || 'نامشخص'}
                </span>
                <span>پلاک: {asset.tag_number}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => assetService.emergencyStop(id)}
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition flex items-center gap-2"
          >
            <AlertTriangle size={20} />
            وضعیت اضطراری
          </button>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex gap-4 mb-6 border-b">
        {['overview', 'parts', 'maintenance', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition ${
              activeTab === tab 
                ? 'border-b-2 border-indigo-600 text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'overview' && 'نمای کلی'}
            {tab === 'parts' && 'قطعات یدکی'}
            {tab === 'maintenance' && 'تاریخچه تعمیرات'}
            {tab === 'documents' && 'اسناد'}
          </button>
        ))}
      </div>

      {/* محتوای تب فعال */}
      {activeTab === 'overview' && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HotspotImage 
              asset={asset} 
              hotspots={asset.hotspots}
              mainImage={asset.main_image} 
            />
          </div>
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">آمار ۳۰ روز اخیر</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>ساعت توقف:</span>
                  <span className="font-bold text-red-600">
                    {dashboard.stats.total_downtime_hours}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>هزینه تعمیرات:</span>
                  <span className="font-bold">
                    {dashboard.stats.total_maintenance_cost.toLocaleString()} ریال
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>تعداد تعمیرات:</span>
                  <span className="font-bold">{dashboard.stats.maintenance_count}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">هشدارهای فعال</h3>
              {dashboard.open_alerts?.length > 0 ? (
                dashboard.open_alerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 mb-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-xs text-gray-600">{alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">بدون هشدار فعال</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'parts' && (
        <PartsInventory assetId={id} />
      )}

      {activeTab === 'maintenance' && (
        <MaintenanceTimeline assetId={id} />
      )}

      {activeTab === 'documents' && (
        <DocumentsPanel assetId={id} />
      )}
    </div>
  );
};

export default AssetDetail;