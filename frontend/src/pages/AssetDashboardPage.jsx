import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Activity, AlertTriangle, Clock, Wrench, ArrowRight } from 'lucide-react'
import assetService from '@services/assetService'
import { Spinner } from '@components/ui'

const AssetDashboardPage = () => {
  const { id } = useParams()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [id])

  const fetchDashboard = async () => {
    try {
      const res = await assetService.getAssetDashboard(id)
      setDashboard(res.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!dashboard) return <div className="text-center py-20 text-gray-500">داده‌ای یافت نشد</div>

  const { asset, stats } = dashboard

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            داشبورد {asset.name}
          </h1>
          <p className="text-gray-500">پلاک: {asset.tag_number}</p>
        </div>
        <Link
          to={`/dashboard/assets/${id}`}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
        >
          جزئیات کامل
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Clock className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ساعت توقف (۳۰ روز)</p>
              <p className="text-2xl font-bold">{stats.total_downtime_hours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Wrench className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">هزینه تعمیرات</p>
              <p className="text-2xl font-bold">
                {stats.total_maintenance_cost?.toLocaleString()} ریال
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">شاخص سلامت</p>
              <p className="text-2xl font-bold text-green-600">
                {asset.health_index?.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* هشدارهای فعال */}
      {dashboard.open_alerts?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            هشدارهای فعال
          </h2>
          <div className="space-y-3">
            {dashboard.open_alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
                <div>
                  <p className="font-bold text-red-700">{alert.title}</p>
                  <p className="text-sm text-red-600 mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetDashboardPage