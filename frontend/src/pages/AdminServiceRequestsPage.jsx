// frontend/src/pages/AdminServiceRequestsPage.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiRefreshCw, FiEye, FiTrash2, FiAlertCircle } from 'react-icons/fi'
import api from '@lib/axios'
import toast from 'react-hot-toast'

// تابع امن فرمت تاریخ
const safeFormatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  } catch (e) {
    return ''
  }
}

export default function AdminServiceRequestsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-service-requests', statusFilter],
    queryFn: () => api.get('/api/services/requests/', {
      params: { status: statusFilter !== 'all' ? statusFilter : undefined }
    }).then(res => res.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/services/requests/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] })
      toast.success('وضعیت با موفقیت تغییر کرد')
    },
    onError: (error) => toast.error(error.response?.data?.message || 'خطا در تغییر وضعیت'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/services/requests/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] })
      toast.success('درخواست با موفقیت حذف شد')
      setDeleteId(null)
    },
    onError: (error) => toast.error(error.response?.data?.message || 'خطا در حذف درخواست'),
  })

  const requests = data?.results || []
  const unmatchedCount = requests.filter(r => r.service === null).length

  const filtered = requests.filter(r => {
    if (showUnmatchedOnly && r.service !== null) return false
    if (search && !r.title?.includes(search) && !r.buyer_name?.includes(search)) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  const statusOptions = [
    { value: 'all', label: 'همه' },
    { value: 'pending', label: 'در انتظار بررسی' },
    { value: 'reviewed', label: 'بررسی شده' },
    { value: 'quoted', label: 'قیمت داده شده' },
    { value: 'accepted', label: 'پذیرفته شده' },
    { value: 'in_progress', label: 'در حال انجام' },
    { value: 'completed', label: 'تکمیل شده' },
    { value: 'cancelled', label: 'لغو شده' },
  ]

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fef3c7',
      reviewed: '#dbeafe',
      quoted: '#e0e7ff',
      accepted: '#dcfce7',
      in_progress: '#f3e8ff',
      completed: '#d1fae5',
      cancelled: '#fee2e2',
    }
    return colors[status] || '#f3f4f6'
  }

  const getStatusTextColor = (status) => {
    const colors = {
      pending: '#92400e',
      reviewed: '#1e40af',
      quoted: '#3730a3',
      accepted: '#166534',
      in_progress: '#6b21a5',
      completed: '#065f46',
      cancelled: '#991b1b',
    }
    return colors[status] || '#374151'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'در انتظار بررسی',
      reviewed: 'بررسی شده',
      quoted: 'قیمت داده شده',
      accepted: 'پذیرفته شده',
      in_progress: 'در حال انجام',
      completed: 'تکمیل شده',
      cancelled: 'لغو شده',
    }
    return labels[status] || status
  }

  const getUrgencyLabel = (urgency) => {
    const labels = { low: 'کم', medium: 'متوسط', high: 'زیاد', critical: 'بحرانی' }
    return labels[urgency] || urgency
  }

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: '#f3f4f6',
      medium: '#dbeafe',
      high: '#ffedd5',
      critical: '#fee2e2',
    }
    return colors[urgency] || '#f3f4f6'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
          خطا در دریافت اطلاعات: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">مدیریت درخواست‌های خدمت</h1>
          <p className="text-sm text-gray-500 mt-1">مدیریت و بررسی تمام درخواست‌های ثبت شده</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unmatchedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <FiAlertCircle className="w-4 h-4" />
              {unmatchedCount} درخواست بدون تطابق
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            مجموع: {requests.length} درخواست
          </span>
        </div>
      </div>

      {/* Alert برای درخواست‌های بدون تطابق */}
      {unmatchedCount > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="text-yellow-600" />
            <span className="font-medium text-yellow-800">{unmatchedCount} درخواست بدون سرویس منطبق</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            این درخواست‌ها نیاز به بررسی دستی توسط ادمین دارند. لطفاً برای هر درخواست، سرویس مناسب را انتخاب کنید.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="جستجو بر اساس عنوان یا خریدار..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowUnmatchedOnly(!showUnmatchedOnly)}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              showUnmatchedOnly 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showUnmatchedOnly ? '✅ نمایش همه' : '⚠️ فقط بدون تطابق'}
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="بازخوانی"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">تأیید حذف</h3>
            <p className="text-gray-600 mb-6">آیا از حذف این درخواست اطمینان دارید؟</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                انصراف
              </button>
              <button onClick={() => deleteMutation.mutate(deleteId)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-right text-sm font-medium text-gray-500">
                <th className="p-3">ID</th>
                <th className="p-3">عنوان درخواست</th>
                <th className="p-3">خریدار</th>
                <th className="p-3">ارائه‌دهنده</th>
                <th className="p-3">تطابق سرویس</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">فوریت</th>
                <th className="p-3">تاریخ ایجاد</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    هیچ درخواستی یافت نشد
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 font-mono text-sm">{req.id}</td>
                    <td className="p-3">
                      <div className="font-medium">{req.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{req.service_title || 'بدون سرویس'}</div>
                    </td>
                    <td className="p-3">
                      <div>{req.buyer_name}</div>
                      <div className="text-xs text-gray-500">{req.buyer_phone}</div>
                    </td>
                    <td className="p-3">{req.provider_name || '—'}</td>
                    <td className="p-3">
                      {req.service ? (
                        <span className="text-green-600 text-sm">✓ {req.service_title}</span>
                      ) : (
                        <span className="text-red-600 text-sm flex items-center gap-1">
                          <FiAlertCircle className="w-3 h-3" />
                          بدون تطابق
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{
                        backgroundColor: getStatusColor(req.status),
                        color: getStatusTextColor(req.status)
                      }}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs whitespace-nowrap" style={{
                        backgroundColor: getUrgencyColor(req.urgency),
                        color: req.urgency === 'critical' ? '#991b1b' : req.urgency === 'high' ? '#9a3412' : req.urgency === 'medium' ? '#1e40af' : '#374151'
                      }}>
                        {getUrgencyLabel(req.urgency)}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-sm">{safeFormatDate(req.created_at)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/admin/service-requests/${req.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="مشاهده جزئیات"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <select
                          value={req.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: req.id, status: e.target.value })}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                          disabled={updateStatusMutation.isPending}
                        >
                          {statusOptions.filter((o) => o.value !== 'all').map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setDeleteId(req.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.count > filtered.length && (
        <div className="flex justify-center gap-2 mt-6">
          <button className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-sm disabled:opacity-50" disabled>
            قبلی
          </button>
          <span className="px-3 py-1 text-sm">صفحه 1 از {Math.ceil(data.count / 10)}</span>
          <button className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-sm disabled:opacity-50" disabled>
            بعدی
          </button>
        </div>
      )}
    </div>
  )
}