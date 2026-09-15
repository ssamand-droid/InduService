import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Package, Search, MapPin, AlertTriangle,
  Download, Upload, Activity, TrendingUp
} from 'lucide-react'
import assetService from '@services/assetService'
import { Spinner } from '@components/ui'
import StatsCard from '@components/ui/StatsCard'
import { Badge } from '@components/ui/Badge'
import SkeletonCard from '@components/ui/SkeletonCard'
import EmptyState from '@components/ui/EmptyState'
import PageHeader from '@components/ui/PageHeader'
import HealthGauge from '@components/ui/HealthGauge'
import UsageLimitBar from '@components/subscription/UsageLimitBar'

const AssetsPage = () => {
  const [assets, setAssets] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [assetsRes, dashRes] = await Promise.all([
        assetService.getAssets(),
        assetService.getGlobalDashboard()
      ])
      setAssets(assetsRes.data?.results || assetsRes.data || [])
      setDashboard(dashRes.data)
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await assetService.downloadTemplate()
      const blob = new Blob([response.data], { type: 'text/csv; charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'asset_import_template.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const filteredAssets = assets.filter(asset => {
    const searchLower = search.toLowerCase()
    return (
      asset.name?.toLowerCase().includes(searchLower) ||
      asset.tag_number?.toLowerCase().includes(searchLower) ||
      asset.brand?.toLowerCase().includes(searchLower) ||
      asset.location?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusVariant = (status) => {
    const variants = {
      operational: 'success',
      degraded: 'warning',
      maintenance: 'danger',
      standby: 'info',
      retired: 'default'
    }
    return variants[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      operational: 'فعال',
      degraded: 'ضعیف',
      maintenance: 'تعمیر',
      standby: 'آماده',
      retired: 'خارج شده'
    }
    return labels[status] || status
  }

  const getHealthColor = (value) => {
    if (value >= 80) return 'green'
    if (value >= 60) return 'yellow'
    return 'red'
  }

  const getHealthTextColor = (value) => {
    if (value >= 80) return 'text-green-700 dark:text-green-400'
    if (value >= 60) return 'text-yellow-700 dark:text-yellow-400'
    return 'text-red-700 dark:text-red-400'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* هدر */}
      <PageHeader
        title="دارایی‌های من"
        description="مدیریت هوشمند تجهیزات و ماشین‌آلات صنعتی"
        actions={
          <>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
            >
              <Download size={18} />
              قالب Excel
            </button>
            <Link
              to="/dashboard/import-assets"
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
            >
              <Upload size={18} />
              واردات انبوه
            </Link>
            <Link
              to="/dashboard/assets/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25"
            >
              <Plus size={18} />
              دستگاه جدید
            </Link>
          </>
        }
      />

      {/* کارت‌های آماری */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
          <StatsCard
            icon={Package}
            title="کل دارایی‌ها"
            value={dashboard.total_assets}
            color="indigo"
          />
          <StatsCard
            icon={Activity}
            title="میانگین سلامت"
            value={`${dashboard.average_health?.toFixed(1)}%`}
            color="green"
            trend={2.5}
          />
          <StatsCard
            icon={AlertTriangle}
            title="هشدار بحرانی"
            value={dashboard.critical_alerts}
            color={dashboard.critical_alerts > 0 ? 'red' : 'blue'}
          />
          {/* در بخش کارت‌های آماری، کارت چهارم رو با این جایگزین کن: */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">مصرف دارایی</p>
            <UsageLimitBar
              used={dashboard.asset_limit?.current || 0}
              limit={dashboard.asset_limit?.max || 5}
            />
          </div>
          {/* <StatsCard
            icon={TrendingUp}
            title="ظرفیت باقی‌مانده"
            value={`${dashboard.asset_limit?.remaining || 0}/${dashboard.asset_limit?.max || 5}`}
            color="indigo"
            subtitle="دارایی رایگان"
          /> */}
        </div>
      )}

      {/* نوار جستجو */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="جستجو در نام، پلاک، برند یا موقعیت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* لیست دارایی‌ها */}
      {loading ? (
        <SkeletonCard count={6} />
      ) : assets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <EmptyState
            title="هنوز دارایی ثبت نشده"
            description="اولین دستگاه خود را ثبت کنید یا با فایل Excel به صورت انبوه وارد کنید"
            actionLink="/dashboard/assets/new"
            actionLabel="ثبت دستگاه جدید"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset, index) => (
              <Link
                key={asset.id}
                to={`/dashboard/assets/${asset.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover-lift transition-all duration-300 group flex flex-col"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* تصویر */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-t-xl overflow-hidden">
                  {asset.main_image ? (
                    <img
                      src={asset.main_image}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="text-gray-300 dark:text-gray-600" size={48} />
                    </div>
                  )}

                  {/* نوار سلامت */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                    <div
                      className={`h-full transition-all duration-700 ${
                        asset.health_index >= 80 ? 'bg-green-500' :
                        asset.health_index >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, asset.health_index || 0))}%` }}
                    />
                  </div>
                </div>

                {/* اطلاعات */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                        {asset.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{asset.tag_number}</p>
                    </div>
                    <Badge variant={getStatusVariant(asset.status)} size="sm" dot pulse={asset.status === 'maintenance'}>
                      {getStatusLabel(asset.status)}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {asset.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="flex-shrink-0" />
                        <span className="truncate">{asset.location}</span>
                      </div>
                    )}
                    {asset.brand && (
                      <div className="truncate">
                        {asset.brand} {asset.model_number ? `- ${asset.model_number}` : ''}
                      </div>
                    )}
                  </div>

                  {/* سلامت */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">سلامت</span>
                      <span className={`text-sm font-bold ${getHealthTextColor(asset.health_index)}`}>
                        {asset.health_index?.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          asset.health_index >= 80 ? 'bg-green-500' :
                          asset.health_index >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, asset.health_index || 0))}%` }}
                      />
                    </div>
                  </div>

                  {asset.alert_count > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium">
                      <AlertTriangle size={14} />
                      {asset.alert_count} هشدار فعال
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {search && filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
              <p className="text-gray-500 dark:text-gray-400">
                نتیجه‌ای برای "{search}" یافت نشد
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AssetsPage