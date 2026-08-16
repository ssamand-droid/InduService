// frontend/src/pages/AdminServiceRequestDetailPage.jsx

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiCheck, FiTrash2, FiEye, FiAlertCircle } from 'react-icons/fi'
import api from '@lib/axios'
import toast from 'react-hot-toast'

// ========================
// توابع امن برای فرمت قیمت و تاریخ
// ========================
const safeFormatPrice = (price) => {
  if (!price && price !== 0) return '—'
  const num = Number(price)
  if (isNaN(num)) return '—'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + ' ریال'
}

const safeFormatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${year}/${month}/${day} ساعت ${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

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

  if (!request) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-center">
          درخواست یافت نشد
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* دکمه بازگشت */}
        <button
          onClick={() => navigate('/dashboard/admin/service-requests')}
          className="flex items-center gap-2 text-blue-600 mb-6 hover:underline"
        >
          <FiArrowLeft className="w-4 h-4" /> بازگشت به لیست
        </button>

        {/* کارت اصلی */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">جزئیات درخواست #{request.id}</h1>
              <p className="text-sm text-gray-500 mt-1">{safeFormatDate(request.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <select
                value={request.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm font-medium cursor-pointer"
                style={{
                  backgroundColor: getStatusColor(request.status),
                  color: getStatusTextColor(request.status),
                  borderColor: 'transparent'
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
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>

          {/* Body - دو ستونه */}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ستون راست - اطلاعات درخواست */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-base">📋 اطلاعات درخواست</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-500 text-sm">عنوان درخواست:</span>
                    <p className="font-medium text-gray-900 mt-1">{request.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">شرح مشکل/نیاز:</span>
                    <p className="text-gray-700 mt-1 whitespace-pre-line break-words">{request.description || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">مشخصات تجهیز:</span>
                    <pre className="mt-1 whitespace-pre-line text-sm bg-gray-50 p-3 rounded-lg overflow-x-auto">
                      {request.equipment_details || '—'}
                    </pre>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 text-sm">فوریت:</span>
                      <p className="mt-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          request.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          request.urgency === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.urgency === 'critical' ? 'بحرانی' : 
                           request.urgency === 'high' ? 'زیاد' : 
                           request.urgency === 'medium' ? 'متوسط' : 'کم'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">تاریخ شروع مطلوب:</span>
                      <p className="mt-1">{request.desired_start_date || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ستون چپ - طرفین */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-base">👥 طرفین</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-500 text-sm">خریدار:</span>
                    <p className="font-medium text-gray-900 mt-1">{request.buyer_name}</p>
                    <p className="text-sm text-gray-500">{request.buyer_phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">ارائه‌دهنده:</span>
                    <p className="mt-1">{request.provider_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">خدمت:</span>
                    <p className="mt-1">
                      {request.service_title ? (
                        <span className="text-green-600">✓ {request.service_title}</span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" /> بدون سرویس منطبق
                        </span>
                      )}
                    </p>
                  </div>
                  {request.related_asset && (
                    <div>
                      <span className="text-gray-500 text-sm">دارایی مرتبط:</span>
                      <p className="mt-1 font-mono text-sm">{request.related_asset}</p>
                      {request.related_asset_name && (
                        <p className="text-sm text-gray-500">{request.related_asset_name}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ردیف دوم - وضعیت و مالی */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-base">💰 وضعیت و مالی</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-500 text-sm">وضعیت:</span>
                    <p className="mt-1">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor: getStatusColor(request.status),
                        color: getStatusTextColor(request.status)
                      }}>
                        {getStatusLabel(request.status)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">قیمت پیشنهادی:</span>
                    <p className="mt-1 font-bold text-green-600 text-lg">{safeFormatPrice(request.quoted_price)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">قیمت نهایی:</span>
                    <p className="mt-1 font-bold text-green-600">{safeFormatPrice(request.final_price)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">پیش‌پرداخت الزامی:</span>
                    <p className="mt-1">{request.advance_payment_required ? 'بله' : 'خیر'}</p>
                  </div>
                  {request.advance_payment_amount > 0 && (
                    <div>
                      <span className="text-gray-500 text-sm">مبلغ پیش‌پرداخت:</span>
                      <p className="mt-1 font-medium">{safeFormatPrice(request.advance_payment_amount)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 text-sm">پیش‌پرداخت پرداخت شده:</span>
                    <p className="mt-1">
                      {request.advance_payment_paid ? (
                        <span className="text-green-600">✓ بله</span>
                      ) : (
                        <span className="text-red-600">✗ خیر</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ردیف دوم - سایر اطلاعات */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-base">📌 سایر اطلاعات</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-500 text-sm">آی دی سفارش:</span>
                    <p className="mt-1">{request.order || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">تاریخ بروزرسانی:</span>
                    <p className="mt-1">{safeFormatDate(request.updated_at)}</p>
                  </div>
                  {request.extra_data && Object.keys(request.extra_data).length > 0 && (
                    <div>
                      <span className="text-gray-500 text-sm">اطلاعات تکمیلی:</span>
                      <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto max-h-32">
                        {JSON.stringify(request.extra_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* لیست پیشنهادهای قیمت */}
            {request.quotes && request.quotes.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 text-base">💰 پیشنهادهای قیمت ({request.quotes.length})</h3>
                <div className="space-y-3">
                  {request.quotes.map((quote) => (
                    <div key={quote.id} className={`p-4 rounded-lg border ${quote.is_selected ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{quote.provider_name}</p>
                          <p className="text-sm text-gray-500">{quote.provider_phone}</p>
                          <p className="text-xl font-bold text-green-600 mt-1">{safeFormatPrice(quote.quoted_price)}</p>
                          {quote.provider_notes && <p className="text-sm text-gray-600 mt-1">{quote.provider_notes}</p>}
                          {quote.is_selected && <p className="text-sm text-green-600 mt-1">✓ انتخاب شده توسط خریدار</p>}
                        </div>
                        {quote.is_selected && (
                          <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">انتخاب شده</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* یادداشت‌ها */}
            {(request.provider_notes || request.completion_notes || request.force_majeure_declared) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 text-base">📝 یادداشت‌ها</h3>
                {request.provider_notes && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-800">یادداشت ارائه‌دهنده:</span>
                    <p className="mt-1 text-blue-700">{request.provider_notes}</p>
                  </div>
                )}
                {request.completion_notes && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-800">✅ یادداشت تکمیل:</span>
                    <p className="mt-1 text-green-700">{request.completion_notes}</p>
                  </div>
                )}
                {request.force_majeure_declared && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-red-800">🚨 فورس ماژور:</span>
                    <p className="mt-1 text-red-700">{request.force_majeure_reason}</p>
                  </div>
                )}
              </div>
            )}

            {/* فایل‌های ضمیمه */}
            {(request.attachments?.length > 0 || request.completion_images?.length > 0) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 text-base">📎 فایل‌های ضمیمه</h3>
                
                {request.attachments?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm mb-2">📄 فایل‌های خریدار ({request.attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {request.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.file_url || att.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
                        >
                          <FiEye className="w-4 h-4" />
                          {att.description || 'فایل'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {request.completion_images?.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-sm mb-2">✅ تصاویر تکمیل کار ({request.completion_images.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {request.completion_images.map((img) => (
                        <img
                          key={img.id}
                          src={img.image_url || img.image}
                          alt="تصویر تکمیل"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
                          onClick={() => setPreviewImage(img.image_url || img.image)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal نمایش تصویر */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-4">
            <img src={previewImage} alt="تصویر" className="w-full rounded-lg" />
            <button
              onClick={() => setPreviewImage(null)}
              className="mt-4 w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  )
}