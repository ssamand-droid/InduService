import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Activity, Thermometer, Wind, Gauge, Zap,
  Plus, TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import assetService from '@services/assetService'
import { Spinner } from '@components/ui'
import { Badge } from '@components/ui/Badge'

const sensorIcons = {
  vibration: Wind,
  temperature: Thermometer,
  pressure: Gauge,
  flow: Wind,
  rpm: Activity,
  current: Zap,
  voltage: Zap,
}

const AssetSensorsPage = () => {
  const { id } = useParams()
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    fetchSensors()
  }, [id])

  const fetchSensors = async () => {
    try {
      const res = await assetService.getSensors(id)
      setSensors(Array.isArray(res.data) ? res.data : res.data?.results || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchReadings = async (sensorId) => {
    try {
      const res = await assetService.getSensorReadings(id, sensorId, 24)
      setChartData(res.data)
      setSelectedSensor(sensorId)
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (sensor) => {
    const status = sensor.last_reading_status
    if (status === 'critical') return <Badge variant="danger" size="sm">بحرانی</Badge>
    if (status === 'warning') return <Badge variant="warning" size="sm">هشدار</Badge>
    if (status === 'normal') return <Badge variant="success" size="sm">نرمال</Badge>
    return <Badge variant="default" size="sm">نامشخص</Badge>
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سنسورها و پایش وضعیت</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">
          <Plus size={18} /> افزودن سنسور
        </button>
      </div>

      {sensors.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Activity className="mx-auto text-gray-300 mb-4" size={64} />
          <p>هیچ سنسوری متصل نیست</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map(sensor => {
            const Icon = sensorIcons[sensor.sensor_type] || Activity
            return (
              <div
                key={sensor.id}
                onClick={() => fetchReadings(sensor.id)}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition ${
                  selectedSensor === sensor.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      sensor.last_reading_status === 'critical' ? 'bg-red-100 text-red-600' :
                      sensor.last_reading_status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{sensor.name}</h3>
                      <p className="text-xs text-gray-500">{sensor.get_sensor_type_display || sensor.sensor_type}</p>
                    </div>
                  </div>
                  {getStatusBadge(sensor)}
                </div>

                {sensor.last_reading !== null ? (
                  <div className="text-center py-3">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {sensor.last_reading}
                    </span>
                    <span className="text-sm text-gray-500 mr-1">{sensor.unit}</span>
                  </div>
                ) : (
                  <p className="text-center py-3 text-gray-400">بدون قرائت</p>
                )}

                {/* آستانه‌ها */}
                <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t dark:border-gray-700">
                  <span>⚠️ {sensor.warning_threshold_high || '-'} {sensor.unit}</span>
                  <span>🚨 {sensor.critical_threshold_high || '-'} {sensor.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* نمودار */}
      {chartData && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
            نمودار قرائت‌ها - ۲۴ ساعت اخیر
          </h3>

          <div className="h-64 flex items-end gap-1">
            {chartData.chart_data?.map((point, i) => {
              const maxVal = Math.max(...chartData.chart_data.map(p => p.value), 1)
              const height = (point.value / maxVal) * 100
              const color = point.status === 'critical' ? 'bg-red-500' :
                           point.status === 'warning' ? 'bg-yellow-500' : 'bg-indigo-500'

              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
                    style={{ height: `${Math.max(height, 1)}%` }}
                    title={`${point.value} - ${new Date(point.time).toLocaleTimeString('fa-IR')}`}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-between mt-4 text-xs text-gray-500">
            <span>۲۴ ساعت قبل</span>
            <span>اکنون</span>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500">حداقل</p>
              <p className="font-bold dark:text-white">{chartData.stats?.min}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500">میانگین</p>
              <p className="font-bold dark:text-white">{chartData.stats?.avg?.toFixed(1)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500">حداکثر</p>
              <p className="font-bold dark:text-white">{chartData.stats?.max}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetSensorsPage