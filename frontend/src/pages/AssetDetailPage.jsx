import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Activity, MapPin, Calendar, Settings, AlertTriangle,
  Package, FileText, Wrench, Plus, Upload, ShoppingBag
} from 'lucide-react'
import assetService from '@services/assetService'
import { Spinner } from '@components/ui'
import { Badge } from '@components/ui/Badge'

const AssetDetailPage = () => {
  const { id } = useParams()

  // همه useState ها اینجا - قبل از هر شرطی
  const [asset, setAsset] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [parts, setParts] = useState([])
  const [documents, setDocuments] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [loading, setLoading] = useState(true)

  // state های فرم‌ها
  const [showAddPart, setShowAddPart] = useState(false)
  const [showAddMaintenance, setShowAddMaintenance] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const [newPart, setNewPart] = useState({
    name: '', part_number: '', stock_quantity: 0, criticality: 'standard'
  })

  const [newMaintenance, setNewMaintenance] = useState({
    maintenance_type: 'preventive',
    title: '',
    description: '',
    downtime_hours: 0,
    labor_cost: 0,
    parts_cost: 0,
    technician: '',
    started_at: new Date().toISOString().split('T')[0],
  })

  const fileInputRef = useRef(null)

  // همه useEffect ها
  useEffect(() => { fetchAsset() }, [id])
  useEffect(() => { if (activeTab === 'parts') fetchParts() }, [activeTab])
  useEffect(() => { if (activeTab === 'documents') fetchDocuments() }, [activeTab])
  useEffect(() => { if (activeTab === 'maintenance') fetchMaintenance() }, [activeTab])

  const fetchAsset = async () => {
    try {
      const res = await assetService.getAsset(id)
      setAsset(res.data)
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  const fetchParts = async () => {
    try {
      const res = await assetService.getParts(id)
      setParts(Array.isArray(res.data) ? res.data : res.data?.results || [])
    } catch (e) { console.error(e) }
  }

  const fetchDocuments = async () => {
    try {
      const res = await assetService.getDocuments(id)
      setDocuments(Array.isArray(res.data) ? res.data : res.data?.results || [])
    } catch (e) { console.error(e) }
  }

  const fetchMaintenance = async () => {
    try {
      const res = await assetService.getMaintenanceLogs(id)
      setMaintenance(Array.isArray(res.data) ? res.data : res.data?.results || [])
    } catch (e) { console.error(e) }
  }

  const handleEmergencyStop = async () => {
    if (!confirm('آیا از اعلام وضعیت اضطراری اطمینان دارید؟')) return
    try {
      await assetService.emergencyStop(id)
      alert('وضعیت اضطراری ثبت شد')
      fetchAsset()
    } catch (error) { alert('خطا در ثبت وضعیت اضطراری') }
  }

  const handleAddPart = async (e) => {
    e.preventDefault()
    try {
      await assetService.addPart(id, newPart)
      setShowAddPart(false)
      setNewPart({ name: '', part_number: '', stock_quantity: 0, criticality: 'standard' })
      fetchParts()
    } catch (error) { console.error('Error adding part:', error) }
  }

  const handleAddMaintenance = async (e) => {
    e.preventDefault()
    try {
      // تبدیل تاریخ به فرمت ISO کامل
      const startedDate = new Date(newMaintenance.started_at)
      // اگر تاریخ معتبر نیست، از امروز استفاده کن
      const validDate = isNaN(startedDate.getTime()) ? new Date() : startedDate
      // تنظیم ساعت به ظهر (برای جلوگیری از مشکلات timezone)
      validDate.setHours(12, 0, 0, 0)

      const payload = {
        maintenance_type: newMaintenance.maintenance_type,
        title: newMaintenance.title,
        description: newMaintenance.description,
        downtime_hours: parseFloat(newMaintenance.downtime_hours) || 0,
        labor_cost: parseInt(newMaintenance.labor_cost) || 0,
        parts_cost: parseInt(newMaintenance.parts_cost) || 0,
        technician: newMaintenance.technician || '',
        started_at: validDate.toISOString(),
        completed_at: validDate.toISOString(), // همون تاریخ برای سادگی
      }

      console.log('📤 Sending maintenance:', payload)

      await assetService.addMaintenanceLog(id, payload)
      setShowAddMaintenance(false)
      setNewMaintenance({
        maintenance_type: 'preventive',
        title: '',
        description: '',
        downtime_hours: 0,
        labor_cost: 0,
        parts_cost: 0,
        technician: '',
        started_at: new Date().toISOString().split('T')[0],
      })
      fetchMaintenance()
    } catch (error) {
      console.error('Error adding maintenance:', error)
      // نمایش خطای سرور
      if (error.response?.data) {
        console.log('Server error:', error.response.data)
      }
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)
      formData.append('document_type', 'other')
      await assetService.uploadDocument(id, formData)
      fetchDocuments()
    } catch (error) { console.error('Error uploading document:', error) }
    finally { setUploadingDoc(false) }
  }

  // رندر شرطی - همه Hook ها قبل از این اجرا شدن
  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!asset) return <div className="text-center py-20 text-gray-500">دستگاه یافت نشد</div>

  const healthColor = asset.health_index >= 80 ? 'text-green-600' : asset.health_index >= 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* هدر */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`text-4xl font-bold ${healthColor}`}>{asset.health_index?.toFixed(0)}%</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{asset.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">پلاک: {asset.tag_number}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="primary" size="sm">{asset.category?.name || 'بدون دسته‌بندی'}</Badge>
                <Badge variant={asset.status === 'operational' ? 'success' : 'warning'} size="sm">
                  {asset.status === 'operational' ? 'فعال' : asset.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/dashboard/assets/${id}/sensors`}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              <Activity size={18} />
              سنسورها
            </Link>
            <Link to={`/dashboard/assets/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
              <Settings size={18} /> ویرایش
            </Link>
            <Link to={`/request-service?asset_id=${id}&asset_name=${encodeURIComponent(asset.name)}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm">
              <Wrench size={18} /> درخواست تعمیر
            </Link>
            <button onClick={handleEmergencyStop}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm">
              <AlertTriangle size={18} /> وضعیت اضطراری
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await assetService.runPrediction(id)
                  alert(`پیش‌بینی انجام شد! ${res.data.total_predictions} مورد پیدا شد`)
                  fetchAsset()
                } catch (e) {
                  console.error(e)
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-sm"
            >
              <Activity size={18} />
              تحلیل پیش‌بینی
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
          {asset.location && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><MapPin size={16} /> {asset.location}</div>}
          {asset.brand && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Package size={16} /> {asset.brand} {asset.model_number}</div>}
          {asset.installation_date && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Calendar size={16} /> نصب: {asset.installation_date}</div>}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Settings size={16} /> {asset.serial_number || 'بدون سریال'}</div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <div className="flex border-b dark:border-gray-700 overflow-x-auto">
          {[
            { key: 'overview', label: 'نمای کلی' },
            { key: 'parts', label: 'قطعات یدکی' },
            { key: 'maintenance', label: 'تاریخچه تعمیرات' },
            { key: 'documents', label: 'اسناد' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                activeTab === tab.key ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3 dark:text-white">اطلاعات فنی</h3>
                  {[
                    ['برند', asset.brand], ['مدل', asset.model_number],
                    ['سال ساخت', asset.year_of_manufacture], ['موقعیت', asset.location]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2 border-b dark:border-gray-700 text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium dark:text-white">{value || '---'}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-bold mb-3 dark:text-white">هشدارهای فعال</h3>
                  {asset.recent_alerts?.length > 0 ? (
                    asset.recent_alerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
                        <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
                        <div>
                          <p className="font-semibold text-sm text-red-700 dark:text-red-400">{alert.title}</p>
                          <p className="text-xs text-red-600 dark:text-red-300">{alert.message}</p>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-gray-400 text-center py-6">بدون هشدار فعال ✅</p>}
                </div>
              </div>
            </div>
          )}

          {/* PARTS */}
          {activeTab === 'parts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold dark:text-white">قطعات یدکی</h3>
                <button onClick={() => setShowAddPart(!showAddPart)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
                  <Plus size={16} /> افزودن قطعه
                </button>
              </div>

              {showAddPart && (
                <form onSubmit={handleAddPart} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="نام قطعه *" value={newPart.name}
                      onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))} required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    <input type="text" placeholder="شماره فنی *" value={newPart.part_number}
                      onChange={(e) => setNewPart(prev => ({ ...prev, part_number: e.target.value }))} required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    <input type="number" placeholder="موجودی" value={newPart.stock_quantity}
                      onChange={(e) => setNewPart(prev => ({ ...prev, stock_quantity: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    <select value={newPart.criticality}
                      onChange={(e) => setNewPart(prev => ({ ...prev, criticality: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                      <option value="standard">استاندارد</option>
                      <option value="important">مهم</option>
                      <option value="vital">حیاتی</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddPart(false)} className="px-4 py-2 text-sm text-gray-600">انصراف</button>
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">ذخیره</button>
                  </div>
                </form>
              )}

              {parts.length === 0 ? (
                <p className="text-gray-400 text-center py-8">هیچ قطعه‌ای ثبت نشده</p>
              ) : (
                <div className="space-y-2">
                  {parts.map(part => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="font-medium dark:text-white">{part.name}</p>
                        <p className="text-xs text-gray-500">{part.part_number}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        part.stock_status === 'in_stock' ? 'bg-green-100 text-green-700' :
                        part.stock_status === 'low_stock' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        موجودی: {part.stock_quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold dark:text-white">تاریخچه تعمیرات</h3>
                <button onClick={() => setShowAddMaintenance(!showAddMaintenance)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
                  <Plus size={16} /> ثبت تعمیر جدید
                </button>
              </div>

              {showAddMaintenance && (
                <form onSubmit={handleAddMaintenance} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="عنوان *" value={newMaintenance.title}
                      onChange={(e) => setNewMaintenance(prev => ({ ...prev, title: e.target.value }))} required
                      className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    <select value={newMaintenance.maintenance_type}
                      onChange={(e) => setNewMaintenance(prev => ({ ...prev, maintenance_type: e.target.value }))}
                      className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <option value="preventive">پیشگیرانه</option>
                      <option value="corrective">اصلاحی</option>
                      <option value="predictive">پیش‌بینانه</option>
                      <option value="emergency">اضطراری</option>
                    </select>
                    <textarea placeholder="توضیحات" value={newMaintenance.description}
                      onChange={(e) => setNewMaintenance(prev => ({ ...prev, description: e.target.value }))}
                      className="md:col-span-2 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" rows={2} />
                    <input type="number" placeholder="ساعت توقف" value={newMaintenance.downtime_hours}
                      onChange={(e) => setNewMaintenance(prev => ({ ...prev, downtime_hours: e.target.value }))}
                      className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    <input type="date" value={newMaintenance.started_at}
                      onChange={(e) => setNewMaintenance(prev => ({ ...prev, started_at: e.target.value }))}
                      className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddMaintenance(false)} className="px-4 py-2 text-sm text-gray-600">انصراف</button>
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">ثبت</button>
                  </div>
                </form>
              )}

              {maintenance.length === 0 ? (
                <p className="text-gray-400 text-center py-8">بدون سابقه تعمیرات</p>
              ) : (
                maintenance.map(log => (
                  <div key={log.id} className="border-r-4 border-indigo-500 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-3">
                    <div className="flex justify-between">
                      <h4 className="font-bold dark:text-white">{log.title}</h4>
                      <span className="text-xs text-gray-500">{new Date(log.started_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>⏱ {log.downtime_hours}h</span>
                      <span>💰 {Number(log.labor_cost || 0 + log.parts_cost || 0).toLocaleString()} ریال</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold dark:text-white">اسناد و مدارک</h3>
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50">
                    {uploadingDoc ? <Spinner size="sm" /> : <Upload size={16} />}
                    آپلود سند
                  </button>
                </div>
              </div>

              {documents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">سندی بارگذاری نشده</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {documents.map(doc => (
                    <a key={doc.id} href={doc.file} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <FileText className="text-indigo-500 flex-shrink-0" size={24} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate dark:text-white">{doc.title}</p>
                        <p className="text-xs text-gray-500">{doc.document_type}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssetDetailPage
