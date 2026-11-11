// frontend/src/pages/ServiceRequestDetailPage.jsx
// نسخه اصلاح شده با رفع مشکلات

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FiArrowRight, FiUser, FiPhone, FiCalendar, FiAlertCircle,
  FiDollarSign, FiPaperclip, FiDownload, FiStar, FiEdit3, FiPlay, FiFlag
} from 'react-icons/fi'
import { useAuthStore } from '@stores/authStore'
import { serviceApi } from '@features/services/services/serviceApi'
import { ServiceCompletionForm } from '@features/services/components/ServiceCompletionForm'
import { UploadReceiptButton } from '@features/services/components/UploadReceiptButton'
import ProviderQuoteModal from '@features/wizard/ProviderQuoteModal'
import { useProviderOnboarding } from '@hooks/useProviderOnboarding'
import toast from 'react-hot-toast'


// ============================================================
// توابع کمکی
// ============================================================

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
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ساعت ${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

// بررسی اینکه فایل تصویر است یا نه (با توجه به پسوند و نوع)
const isImageFile = (file) => {
  if (!file) return false
  const url = file.file_url || file.file || file.image_url || file.image || ''
  const name = file.name || file.description || ''
  const ext = url.split('.').pop()?.toLowerCase() || name.split('.').pop()?.toLowerCase() || ''
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico', 'avif', 'heic']
  if (imageExts.includes(ext)) return true
  if (file.is_image === true || file.is_image === 'true') return true
  if (file.content_type?.startsWith('image/')) return true
  return false
}

// نقش‌های کاربر
const BUYER_ROLES = ['buyer', 'technician', 'maintenance_manager', 'procurement']
const PROVIDER_ROLES = ['seller', 'service_provider', 'company_seller', 'company_provider']

// ============================================================
// کامپوننت اصلی
// ============================================================

export default function ServiceRequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [quoteModal, setQuoteModal] = useState(false)
  const [completionModal, setCompletionModal] = useState(false)

  const isBuyer = BUYER_ROLES.includes(user?.role)
  const isProvider = PROVIDER_ROLES.includes(user?.role)

  // ========== اضافه شده ==========
  const { isProfileComplete } = useProviderOnboarding()
  // ===============================

  const { data: request, isLoading, error, refetch } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => serviceApi.getServiceRequest(id),
    enabled: !!id,
  })

  // ============================================================
  // اکشن‌ها
  // ============================================================

  const acceptQuote = async (quoteId, providerName, price) => {
    const isConfirmed = window.confirm(
      `آیا از انتخاب پیشنهاد ${providerName} به مبلغ ${price?.toLocaleString()} ریال اطمینان دارید؟\n\n` +
      `پس از تأیید، سایر پیشنهادها لغو می‌شوند و امکان تغییر وجود ندارد.`
    )
    if (!isConfirmed) return

    try {
      const response = await serviceApi.acceptQuote(id, { quote_id: quoteId })
      toast.success(response?.message || 'پیشنهاد با موفقیت انتخاب شد')
      refetch()
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'خطا در انتخاب پیشنهاد'
      toast.error(errorMessage)
    }
  }

  const startWork = async () => {
    try {
      await serviceApi.startWork(id)
      toast.success('کار با موفقیت شروع شد')
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.userMessage || 'خطا در شروع کار')
    }
  }

  const acceptCompletion = async () => {
    if (!window.confirm('آیا گزارش و نتیجهٔ کار را تأیید می‌کنید؟')) return
    try {
      const response = await serviceApi.acceptCompletion(id)
      toast.success(response?.message || 'گزارش کار تأیید شد')
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.userMessage || 'خطا در تأیید گزارش')
    }
  }

  const requestCompletionRevision = async () => {
    const note = window.prompt('نقص یا اصلاح موردنیاز را توضیح دهید:')
    if (!note?.trim()) return
    try {
      const response = await serviceApi.requestCompletionRevision(id, note.trim())
      toast.success(response?.message || 'درخواست اصلاح برای ارائه‌دهنده ارسال شد')
      refetch()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.userMessage || 'خطا در ارسال درخواست اصلاح')
    }
  }

  // ============================================================
  // وضعیت‌ها و رنگ‌ها
  // ============================================================

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'در انتظار بررسی',
      reviewed: 'بررسی شده',
      quoted: 'قیمت داده شده',
      accepted: 'پذیرفته شده',
      rejected: 'رد شده',
      in_progress: 'در حال انجام',
      submitted_for_acceptance: 'در انتظار تأیید کارخانه',
      completed: 'تکمیل شده',
      cancelled: 'لغو شده'
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      quoted: 'bg-indigo-100 text-indigo-800',
      accepted: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      submitted_for_acceptance: 'bg-amber-100 text-amber-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // ============================================================
  // رندرهای شرطی
  // ============================================================

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
          خطا در دریافت اطلاعات
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

  // ============================================================
  // محاسبات وضعیت
  // ============================================================

  const hasSelected = request.quotes?.some(q => q.is_selected === true) || false
  const hasUserQuoted = request.quotes?.some(q => q.provider === user?.id) || false

  // تشخیص ارائه‌دهنده انتخاب شده
  const selectedQuote = request.quotes?.find((quote) => quote.is_selected)
  const selectedProviderId = selectedQuote?.provider ??
    (typeof request.service === 'object' ? request.service?.provider?.id : request.provider_id)
  const isSelectedProvider = String(selectedProviderId ?? '') === String(user?.id ?? '')

  // تشخیص اینکه آیا ارائه‌دهنده فعلی می‌تواند شروع کند
  const canStartWork = isProvider &&
    isSelectedProvider &&
    request.status === 'accepted'

  // تشخیص اینکه آیا ارائه‌دهنده فعلی می‌تواند تکمیل کند
  const canCompleteWork = isProvider &&
    isSelectedProvider &&
    request.status === 'in_progress'

  // ============================================================
  // رندر اصلی
  // ============================================================

  return (
    <div className="p-3 sm:p-4 md:p-6" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        {/* دکمه بازگشت */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 mb-6 hover:underline"
        >
          <FiArrowRight /> بازگشت به لیست
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ========================================================== */}
          {/* ستون اصلی */}
          {/* ========================================================== */}
          <div className="lg:col-span-2 space-y-6">

            {/* کارت اطلاعات اصلی */}
            <div className="bg-white rounded-xl border p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold">{request.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>

              {request.description && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-500 mb-1">شرح مشکل</h3>
                  <p className="text-gray-900 whitespace-pre-line break-words">{request.description}</p>
                </div>
              )}

              {request.equipment_details && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-500 mb-1">مشخصات تجهیز</h3>
                  <p className="text-gray-900 whitespace-pre-line break-words">{request.equipment_details}</p>
                </div>
              )}

              {/* 🔥 فایل‌های ضمیمه - اصلاح شده */}
              {request.attachments?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <FiPaperclip /> فایل‌های ضمیمه ({request.attachments.length})
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                    {request.attachments.map((att) => {
                      const fileUrl = att.file_url || att.file || att.url || ''
                      const isImage = isImageFile(att)
                      return (
                        <a
                          key={att.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition group"
                        >
                          {isImage ? (
                            <img
                              src={fileUrl}
                              alt={att.description || att.name || 'تصویر'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // اگر تصویر لود نشد، fallback نشان بده
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = `
                                  <div class="flex flex-col items-center justify-center h-full bg-gray-100">
                                    <FiDownload class="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                                    <span class="text-xs text-gray-500 mt-1 truncate px-1">${att.name || 'فایل'}</span>
                                  </div>
                                `
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-100">
                              <FiDownload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-hover:text-blue-500 transition" />
                              <span className="text-xs text-gray-500 mt-1 truncate px-1">{att.name || att.description || 'فایل'}</span>
                            </div>
                          )}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 🔥 تصاویر تکمیل کار - اصلاح شده */}
              {request.completion_images?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                    ✅ تصاویر انجام کار ({request.completion_images.length})
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                    {request.completion_images.map((img, index) => {
                      const imgUrl = img.image_url || img.image || img.file_url || img.file || img.url || ''
                      const isImage = isImageFile(img)
                      return (
                        <a
                          key={img.id || index}
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-lg overflow-hidden border border-green-200 hover:border-green-500 transition group"
                        >
                          {isImage ? (
                            <img
                              src={imgUrl}
                              alt={img.description || img.name || 'تصویر تکمیل'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = `
                                  <div class="flex flex-col items-center justify-center h-full bg-gray-100">
                                    <FiDownload class="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                                    <span class="text-xs text-gray-500 mt-1 truncate px-1">تصویر تکمیل</span>
                                  </div>
                                `
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-100">
                              <FiDownload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                              <span className="text-xs text-gray-500 mt-1 truncate px-1">تصویر تکمیل</span>
                            </div>
                          )}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {request.provider_notes && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm mb-4">
                  <span className="font-medium">یادداشت ارائه‌دهنده:</span> {request.provider_notes}
                </div>
              )}

              {request.completion_notes && (
                <div className="p-3 bg-green-50 rounded-lg text-sm mb-4">
                  <span className="font-medium">✅ یادداشت تکمیل:</span> {request.completion_notes}
                </div>
              )}

              {request.force_majeure_declared && (
                <div className="p-3 bg-red-50 rounded-lg text-sm mb-4">
                  <span className="font-medium">🚨 فورس ماژور:</span> {request.force_majeure_reason}
                </div>
              )}

              {request.buyer_rating && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${star <= request.buyer_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="text-sm font-medium mr-2">{request.buyer_rating}/۵</span>
                  </div>
                  {request.buyer_review && <p className="text-gray-700 break-words">{request.buyer_review}</p>}
                </div>
              )}
            </div>

            {/* پیشنهاد خود ارائه‌دهنده */}
            {isProvider && request.quotes?.length > 0 && (
              <div className="bg-white rounded-xl border p-4 sm:p-6">
                <h3 className="font-semibold text-lg mb-3">💰 پیشنهاد شما</h3>
                {request.quotes
                  .filter(q => q.provider === user?.id)
                  .map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-4 bg-blue-50">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{safeFormatPrice(quote.quoted_price)}</p>
                      {quote.provider_notes && <p className="text-sm text-gray-600 mt-2">{quote.provider_notes}</p>}
                      {quote.is_selected ? (
                        <p className="text-sm text-green-600 mt-2">✅ پیشنهاد شما توسط خریدار انتخاب شده است</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">در انتظار انتخاب خریدار</p>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* لیست پیشنهادها برای خریدار */}
            {isBuyer && request.quotes?.length > 0 && (request.status === 'reviewed' || request.status === 'quoted') && (
              <div className="bg-white rounded-xl border p-4 sm:p-6">
                <h3 className="font-semibold text-lg mb-3">💰 پیشنهادهای قیمت ({request.quotes.length})</h3>
                <div className="space-y-3">
                  {request.quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className={`border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        quote.is_selected ? 'bg-green-50 border-green-300' : 'bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{quote.provider_name}</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{safeFormatPrice(quote.quoted_price)}</p>
                        {quote.estimated_completion_date && (
                          <p className="text-sm text-gray-500 mt-1">📅 زمان تخمینی: {safeFormatDate(quote.estimated_completion_date)}</p>
                        )}
                        {quote.provider_notes && <p className="text-sm text-gray-600 mt-2">{quote.provider_notes}</p>}
                        {quote.advance_payment_required && quote.advance_payment_amount && (
                          <p className="text-sm text-yellow-600 mt-1">⚠️ پیش‌پرداخت: {safeFormatPrice(quote.advance_payment_amount)}</p>
                        )}
                      </div>
                      {!hasSelected && !quote.is_selected && (
                        <button
                          onClick={() => acceptQuote(quote.id, quote.provider_name, quote.quoted_price)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                        >
                          انتخاب این پیشنهاد
                        </button>
                      )}
                      {quote.is_selected && (
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-center w-full sm:w-auto">✓ انتخاب شده</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================== */}
          {/* ستون کناری */}
          {/* ========================================================== */}
          <div className="space-y-6">

            {/* اطلاعات */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">اطلاعات</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <FiUser className="text-gray-400 shrink-0" />
                  <span className="break-words">{request.buyer_name}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FiPhone className="text-gray-400 shrink-0" />
                  <span className="break-words">{request.buyer_phone}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FiCalendar className="text-gray-400 shrink-0" />
                  <span>{safeFormatDate(request.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FiAlertCircle className="text-gray-400 shrink-0" />
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    request.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                    request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                    request.urgency === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.urgency === 'critical' ? 'بحرانی' :
                     request.urgency === 'high' ? 'زیاد' :
                     request.urgency === 'medium' ? 'متوسط' : 'کم'}
                  </span>
                </div>
              </div>
            </div>

            {/* قیمت اعلام شده */}
            {request.quoted_price && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-2">قیمت اعلام شده</h3>
                <p className="text-2xl font-bold text-green-600">{safeFormatPrice(request.quoted_price)}</p>
                {request.advance_payment_required && request.advance_payment_amount && (
                  <p className="text-sm text-yellow-600 mt-2">⚠️ پیش‌پرداخت: {safeFormatPrice(request.advance_payment_amount)}</p>
                )}
              </div>
            )}

            {/* 🔥 اقدامات برای ارائه‌دهنده - اصلاح شده */}
            {isProvider && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-3 text-gray-700 border-b pb-2">⚙️ اقدامات</h3>

                {/* دکمه اعلام قیمت */}
                {(request.status === 'pending' || request.status === 'reviewed' || request.status === 'quoted') && !hasUserQuoted && (
                  <button
                    onClick={() => {
                      if (!isProfileComplete) {
                        toast.error('لطفاً ابتدا پروفایل خود را تکمیل کنید', {
                          duration: 4000,
                        });
                        navigate('/dashboard/provider/onboarding')
                        return;
                      }
                      setQuoteModal(true);
                    }}
                    className="w-full mb-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FiEdit3 size={18} /> اعلام قیمت و شرایط
                  </button>
                )}

                {/* 🔥 دکمه شروع کار - اصلاح شده */}
                {canStartWork && (
                  <button
                    onClick={startWork}
                    className="w-full mb-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <FiPlay size={18} /> شروع کار
                  </button>
                )}

                {/* 🔥 دکمه تکمیل کار - اصلاح شده */}
                {canCompleteWork && (
                  <button
                    onClick={() => setCompletionModal(true)}
                    className="w-full mb-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <FiFlag size={18} /> تکمیل خدمت
                  </button>
                )}

                {/* نمایش وضعیت برای ارائه‌دهنده */}
                {!canStartWork && !canCompleteWork && request.status !== 'pending' && request.status !== 'reviewed' && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    {request.status === 'accepted' ? 'در انتظار شروع کار توسط شما' :
                     request.status === 'in_progress' ? 'در حال انجام...' :
                     request.status === 'completed' ? '✅ این خدمت تکمیل شده است' :
                     request.status === 'cancelled' ? '❌ این خدمت لغو شده است' :
                     `وضعیت: ${getStatusLabel(request.status)}`}
                  </p>
                )}
              </div>
            )}

            {isBuyer && request.status === 'submitted_for_acceptance' && (
              <div className="bg-white rounded-xl border border-amber-200 p-6">
                <h3 className="font-semibold mb-2 text-amber-800">گزارش کار در انتظار بررسی شماست</h3>
                {request.completion_notes && (
                  <p className="text-sm text-gray-700 whitespace-pre-line mb-4">{request.completion_notes}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={acceptCompletion}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    تأیید و پذیرش کار
                  </button>
                  <button
                    onClick={requestCompletionRevision}
                    className="px-4 py-2 border border-amber-500 text-amber-800 rounded-lg hover:bg-amber-50"
                  >
                    درخواست اصلاح
                  </button>
                </div>
              </div>
            )}

            {/* پرداخت‌ها */}
            {isBuyer && request.status === 'accepted' && request.advance_payment_required && !request.advance_payment_paid && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">💳 پرداخت پیش‌پرداخت</h3>
                <p className="text-sm text-gray-500 mb-4">
                  مبلغ پیش‌پرداخت: <strong className="text-blue-600">{safeFormatPrice(request.advance_payment_amount)}</strong>
                </p>
                <UploadReceiptButton requestId={request.id} paymentType="advance" onSuccess={refetch} />
              </div>
            )}

            {isBuyer && request.status === 'completed' && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">💳 پرداخت نهایی</h3>
                <p className="text-sm text-gray-500 mb-4">
                  مبلغ کل: <strong className="text-blue-600">{safeFormatPrice(request.final_price || request.quoted_price)}</strong>
                </p>
                <UploadReceiptButton requestId={request.id} paymentType="final" onSuccess={refetch} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* مودال‌ها */}
      {/* ============================================================ */}

      {/* مودال ویزارد پیشنهاد */}
      <ProviderQuoteModal
        isOpen={quoteModal}
        onClose={() => setQuoteModal(false)}
        request={request}
        onSuccess={() => { setQuoteModal(false); refetch(); }}
      />

      {/* مودال تکمیل خدمت */}
      <ServiceCompletionForm
        isOpen={completionModal}
        onClose={() => setCompletionModal(false)}
        request={request}
        onSuccess={() => { setCompletionModal(false); refetch(); }}
      />
    </div>
  )
}
