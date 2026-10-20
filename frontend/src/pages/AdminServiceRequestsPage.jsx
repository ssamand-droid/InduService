// frontend/src/pages/AdminServiceRequestsPage.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@lib/axios'
import toast from 'react-hot-toast'

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

  const formatSimpleDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  const requests = data?.results || []

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
    { value: 'pending_acceptance', label: 'در انتظار تأیید کارخانه' },
    { value: 'completed', label: 'تأیید نهایی شده' },
    { value: 'cancelled', label: 'لغو شده' },
  ]

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fef3c7',
      reviewed: '#dbeafe',
      quoted: '#e0e7ff',
      accepted: '#dcfce7',
      in_progress: '#f3e8ff',
      pending_acceptance: '#fef3c7',
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
      pending_acceptance: '#92400e',
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
      pending_acceptance: 'در انتظار تأیید کارخانه',
      completed: 'تأیید نهایی شده',
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

  const unmatchedCount = requests.filter(r => r.service === null).length

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>در حال بارگذاری...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem', color: '#dc2626' }}>
          خطا در دریافت اطلاعات: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>مدیریت درخواست‌های خدمت</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>مدیریت و بررسی تمام درخواست‌های ثبت شده</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unmatchedCount > 0 && (
            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
              ⚠️ {unmatchedCount} درخواست بدون تطابق
            </span>
          )}
          <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
            مجموع: {requests.length} درخواست
          </span>
        </div>
      </div>

      {/* Alert برای درخواست‌های بدون تطابق */}
      {unmatchedCount > 0 && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <span style={{ fontWeight: '500', color: '#92400e' }}>{unmatchedCount} درخواست بدون سرویس منطبق</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#92400e', marginTop: '0.25rem' }}>
            این درخواست‌ها نیاز به بررسی دستی توسط ادمین دارند. لطفاً برای هر درخواست، سرویس مناسب را انتخاب کنید.
          </p>
        </div>
      )}

      {/* Filters */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="جستجو بر اساس ID, عنوان, خریدار, ارائه‌دهنده..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: 'white' }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowUnmatchedOnly(!showUnmatchedOnly)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: showUnmatchedOnly ? '#fef3c7' : '#f3f4f6',
              color: showUnmatchedOnly ? '#92400e' : '#374151',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {showUnmatchedOnly ? '✅ نمایش همه' : '⚠️ فقط بدون تطابق'}
          </button>
          <button
            onClick={() => refetch()}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
          >
            🔄 بازخوانی
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '28rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>تأیید حذف</h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>آیا از حذف این درخواست اطمینان دارید؟</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>انصراف</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr style={{ textAlign: 'right', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>عنوان درخواست</th>
                <th style={{ padding: '0.75rem' }}>Buyer</th>
                <th style={{ padding: '0.75rem' }}>ارائه‌دهنده</th>
                <th style={{ padding: '0.75rem' }}>تطابق سرویس</th>
                <th style={{ padding: '0.75rem' }}>وضعیت</th>
                <th style={{ padding: '0.75rem' }}>فوریت</th>
                <th style={{ padding: '0.75rem' }}>تاریخ ایجاد</th>
                <th style={{ padding: '0.75rem' }}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>هیچ درخواستی یافت نشد</td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{req.id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500' }}>{req.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{req.service_title || 'بدون سرویس'}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>{req.buyer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{req.buyer_phone}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{req.provider_name || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {req.service ? (
                        <span style={{ color: '#16a34a', fontSize: '0.875rem' }}>✓ {req.service_title}</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          ⚠️ بدون تطابق
                          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>(نیاز به بررسی)</span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: getStatusColor(req.status),
                        color: getStatusTextColor(req.status)
                      }}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        backgroundColor: getUrgencyColor(req.urgency),
                        color: req.urgency === 'critical' ? '#991b1b' : req.urgency === 'high' ? '#9a3412' : req.urgency === 'medium' ? '#1e40af' : '#374151'
                      }}>
                        {getUrgencyLabel(req.urgency)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>{formatSimpleDate(req.created_at)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigate(`/dashboard/admin/service-requests/${req.id}`)}
                          style={{ color: '#2563eb', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
                          title="مشاهده جزئیات"
                        >
                          👁 جزئیات
                        </button>
                        <select
                          value={req.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: req.id, status: e.target.value })}
                          style={{ fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', padding: '0.125rem 0.25rem' }}
                          disabled={updateStatusMutation.isPending}
                        >
                          {statusOptions.filter((o) => o.value !== 'all').map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setDeleteId(req.id)}
                          style={{ color: '#dc2626', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
                          title="حذف"
                        >
                          🗑 حذف
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button style={{ padding: '0.25rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', background: 'white', cursor: 'pointer' }}>قبلی</button>
          <span style={{ padding: '0.25rem 0.75rem' }}>صفحه 1 از {Math.ceil(data.count / 10)}</span>
          <button style={{ padding: '0.25rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', background: 'white', cursor: 'pointer' }}>بعدی</button>
        </div>
      )}
    </div>
  )
}