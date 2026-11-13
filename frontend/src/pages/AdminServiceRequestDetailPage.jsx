// frontend/src/pages/AdminServiceRequestDetailPage.jsx

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@lib/axios'
import { formatPrice, formatDate } from '@lib/utils'
import toast from 'react-hot-toast'

export default function AdminServiceRequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [previewImage, setPreviewImage] = useState(null)

  const { data: request, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-service-request', id],
    queryFn: () => api.get(`/api/services/requests/${id}/`).then(res => res.data),
    enabled: !!id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status) => api.patch(`/api/services/requests/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-request', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] })
      toast.success('وضعیت با موفقیت تغییر کرد')
    },
    onError: (error) => toast.error(error.response?.data?.message || 'خطا در تغییر وضعیت'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/services/requests/${id}/`),
    onSuccess: () => {
      toast.success('درخواست حذف شد')
      navigate('/dashboard/admin/service-requests')
    },
    onError: (error) => toast.error(error.response?.data?.message || 'خطا در حذف درخواست'),
  })

  const formatSimpleDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ساعت ${date.getHours()}:${date.getMinutes()}`
  }

  const statusOptions = [
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

  if (!request) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '1rem', color: '#92400e' }}>
          درخواست یافت نشد
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* دکمه بازگشت */}
        <button
          onClick={() => navigate('/dashboard/admin/service-requests')}
          style={{ color: '#2563eb', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          ← بازگشت به لیست
        </button>

        {/* کارت اصلی */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>جزئیات درخواست #{request.id}</h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {formatSimpleDate(request.created_at)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={request.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: getStatusColor(request.status),
                  color: getStatusTextColor(request.status),
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                disabled={updateStatusMutation.isPending}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (window.confirm('آیا از حذف این درخواست اطمینان دارید؟')) {
                    deleteMutation.mutate()
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>

          {/* Body - دو ستونه */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', padding: '1.5rem' }}>
            {/* ستون راست - اطلاعات درخواست */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>اطلاعات درخواست</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>عنوان درخواست:</span>
                  <p style={{ fontWeight: '500', marginTop: '0.25rem' }}>{request.title}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>شرح مشکل/نیاز:</span>
                  <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-line' }}>{request.description || '—'}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>مشخصات تجهیز:</span>
                  <pre style={{ marginTop: '0.25rem', whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    {request.equipment_details || '—'}
                  </pre>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>فوریت:</span>
                    <p style={{ marginTop: '0.25rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        backgroundColor: request.urgency === 'critical' ? '#fee2e2' : request.urgency === 'high' ? '#ffedd5' : '#dbeafe',
                        color: request.urgency === 'critical' ? '#991b1b' : request.urgency === 'high' ? '#9a3412' : '#1e40af'
                      }}>
                        {request.urgency === 'critical' ? 'بحرانی' : request.urgency === 'high' ? 'زیاد' : request.urgency === 'medium' ? 'متوسط' : 'کم'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>تاریخ شروع مطلوب:</span>
                    <p style={{ marginTop: '0.25rem' }}>{request.desired_start_date || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ستون چپ - طرفین */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>طرفین</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Buyer ID:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.buyer}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>نام:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.buyer_name}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>تلفن:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.buyer_phone}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>ارائه‌دهنده:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.provider_name || '—'}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>خدمت:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.service_title || 'بدون سرویس'}</p>
                </div>
                {request.related_asset && (
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>دستگاه مرتبط:</span>
                    <p style={{ marginTop: '0.25rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{request.related_asset}</span>
                      {request.related_asset_name && <span style={{ color: '#6b7280', marginRight: '0.5rem' }}>({request.related_asset_name})</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ستون راست - وضعیت و مالی (ردیف دوم) */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>وضعیت و مالی</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>وضعیت:</span>
                  <p style={{ marginTop: '0.25rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: getStatusColor(request.status),
                      color: getStatusTextColor(request.status)
                    }}>
                      {getStatusLabel(request.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>قیمت پیشنهادی:</span>
                  <p style={{ marginTop: '0.25rem', fontWeight: '500', color: '#16a34a' }}>
                    {request.quoted_price ? request.quoted_price.toLocaleString() + ' ریال' : '—'}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>قیمت نهایی:</span>
                  <p style={{ marginTop: '0.25rem', fontWeight: '500', color: '#16a34a' }}>
                    {request.final_price ? request.final_price.toLocaleString() + ' ریال' : '—'}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>پیش‌پرداخت الزامی:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.advance_payment_required ? 'بله' : 'خیر'}</p>
                </div>
                {request.advance_payment_amount && (
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>مبلغ پیش‌پرداخت:</span>
                    <p style={{ marginTop: '0.25rem' }}>{request.advance_payment_amount.toLocaleString()} ریال</p>
                  </div>
                )}
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>پیش‌پرداخت پرداخت شده:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.advance_payment_paid ? 'بله' : 'خیر'}</p>
                </div>
              </div>
            </div>

            {/* ستون چپ - سایر اطلاعات (ردیف دوم) */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>سایر اطلاعات</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>اطلاعات تکمیلی:</span>
                  <pre style={{
                    marginTop: '0.25rem',
                    backgroundColor: '#f9fafb',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: '150px'
                  }}>
                    {JSON.stringify(request.extra_data, null, 2)}
                  </pre>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Order:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.order || '—'}</p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>تاریخ بروزرسانی:</span>
                  <p style={{ marginTop: '0.25rem' }}>{formatSimpleDate(request.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* لیست پیشنهادهای قیمت */}
          {request.quotes && request.quotes.length > 0 && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>💰 پیشنهادهای قیمت ({request.quotes.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {request.quotes.map((quote) => (
                  <div key={quote.id} style={{
                    padding: '1rem',
                    backgroundColor: quote.is_selected ? '#dcfce7' : 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <p style={{ fontWeight: '600' }}>{quote.provider_name}</p>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{quote.provider_phone}</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a', marginTop: '0.25rem' }}>
                        {quote.quoted_price.toLocaleString()} ریال
                      </p>
                      {quote.provider_notes && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{quote.provider_notes}</p>}
                      {quote.is_selected && <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>✓ انتخاب شده توسط خریدار</p>}
                    </div>
                    {quote.is_selected && (
                      <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '0.75rem' }}>
                        انتخاب شده
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* یادداشت‌ها */}
          {(request.provider_notes || request.completion_notes || request.force_majeure_declared) && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>یادداشت‌ها</h3>
              {request.provider_notes && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>یادداشت ارائه‌دهنده:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.provider_notes}</p>
                </div>
              )}
              {request.completion_notes && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>✅ یادداشت تکمیل:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.completion_notes}</p>
                </div>
              )}
              {request.force_majeure_declared && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>🚨 فورس ماژور:</span>
                  <p style={{ marginTop: '0.25rem' }}>{request.force_majeure_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* فایل‌های ضمیمه */}
          {(request.attachments?.length > 0 || request.completion_images?.length > 0) && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>فایل‌های ضمیمه</h3>

              {request.attachments?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>📎 فایل‌های خریدار ({request.attachments.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {request.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.file_url || att.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}
                      >
                        📄 {att.description || 'فایل'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {request.completion_images?.length > 0 && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>✅ تصاویر تکمیل کار ({request.completion_images.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {request.completion_images.map((img) => (
                      <a
                        key={img.id}
                        href={img.image_url || img.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'block' }}
                      >
                        <img
                          src={img.image_url || img.image}
                          alt=""
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                          onClick={() => setPreviewImage(img.image_url || img.image)}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal نمایش تصویر */}
      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1rem', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <img src={previewImage} alt="تصویر" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '0.25rem' }} />
            <button onClick={() => setPreviewImage(null)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', width: '100%' }}>
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
