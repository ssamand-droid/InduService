// frontend/src/features/dashboard/buyer/MyServiceRequests.jsx

import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiCheck, FiEdit2, FiPlay, FiFlag, FiEdit3, FiPlus, FiEye,
  FiStar, FiAlertTriangle, FiCreditCard, FiUpload
} from 'react-icons/fi'
import { useServiceRequests, useAcceptQuote, useStartWork, useCompleteService, useSubmitReview } from '@features/services/hooks/useServices'
import { ServiceRequestUpdateForm } from '@features/services/components/ServiceRequestUpdateForm'
import { ProviderQuoteForm } from '@features/services/components/ProviderQuoteForm'
import { ServiceCompletionForm } from '@features/services/components/ServiceCompletionForm'
import { useAuthStore } from '@stores/authStore'
import { SERVICE_REQUEST_STATUS, BUYER_ROLES, PROVIDER_ROLES } from '@lib/constants'
import { serviceApi } from '@features/services/services/serviceApi'
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
    return `${year}/${month}/${day}`
  } catch (e) {
    return ''
  }
}

const statusLabels = {
  [SERVICE_REQUEST_STATUS.PENDING]: 'در انتظار بررسی',
  [SERVICE_REQUEST_STATUS.REVIEWED]: 'بررسی شده',
  [SERVICE_REQUEST_STATUS.QUOTED]: 'قیمت داده شده',
  [SERVICE_REQUEST_STATUS.ACCEPTED]: 'پذیرفته شده',
  [SERVICE_REQUEST_STATUS.REJECTED]: 'رد شده',
  [SERVICE_REQUEST_STATUS.IN_PROGRESS]: 'در حال انجام',
  [SERVICE_REQUEST_STATUS.COMPLETED]: 'تکمیل شده',
  [SERVICE_REQUEST_STATUS.CANCELLED]: 'لغو شده',
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  quoted: 'bg-indigo-100 text-indigo-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function MyServiceRequests() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const fileRef = useRef(null)
  
  const isBuyer = BUYER_ROLES.includes(user?.role)
  const isProvider = PROVIDER_ROLES.includes(user?.role)

  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, requestId: null })
  const [quoteModal, setQuoteModal] = useState({ isOpen: false, request: null })
  const [editModal, setEditModal] = useState({ isOpen: false, request: null })
  const [completionModal, setCompletionModal] = useState({ isOpen: false, request: null })
  const [forceMajeureModal, setForceMajeureModal] = useState({ isOpen: false, request: null })
  const [reviewModal, setReviewModal] = useState({ isOpen: false, request: null })
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, request: null, type: '' })
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [forceMajeureReason, setForceMajeureReason] = useState('')
  const [paymentFile, setPaymentFile] = useState(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  // Data
  const { data, isLoading, error, refetch } = useServiceRequests()
  const { mutate: acceptQuote, isPending: isAccepting } = useAcceptQuote()
  const { mutate: startWork, isPending: isStarting } = useStartWork()
  const { mutate: completeService, isPending: isCompleting } = useCompleteService()
  const { mutate: submitReview } = useSubmitReview()

  const requests = data?.results || []

  const handleAcceptQuote = (id) => {
    acceptQuote({ id }, {
      onSuccess: (data) => {
        setConfirmModal({ isOpen: false, requestId: null })
        if (data.advance_payment_required) {
          const req = requests.find(r => r.id === id)
          setPaymentModal({ isOpen: true, request: req, type: 'advance' })
        }
        refetch()
      }
    })
  }

  const handleViewDetails = (requestId) => navigate(`/dashboard/service-requests/${requestId}`)

  const handleForceMajeure = async () => {
    if (!forceMajeureReason.trim()) { toast.error('دلیل را وارد کنید'); return }
    try {
      await serviceApi.forceMajeure(forceMajeureModal.request.id, forceMajeureReason)
      toast.success('فورس ماژور ثبت شد')
      setForceMajeureModal({ isOpen: false, request: null })
      setForceMajeureReason('')
      refetch()
    } catch (error) { toast.error('خطا') }
  }

  const handleSubmitReview = async () => {
    submitReview(
      { id: reviewModal.request.id, data: { rating: reviewRating, review: reviewText } },
      { onSuccess: () => { setReviewModal({ isOpen: false, request: null }); setReviewText(''); refetch(); } }
    )
  }

  const handlePaymentUpload = async () => {
    if (!paymentFile) { toast.error('فایل رسید را انتخاب کنید'); return }
    setIsSubmittingPayment(true)
    try {
      if (paymentModal.type === 'advance') {
        await serviceApi.payAdvance(paymentModal.request.id, paymentFile)
        toast.success('پیش‌پرداخت ثبت شد')
      } else {
        await serviceApi.finalPayment(paymentModal.request.id, paymentFile)
        toast.success('پرداخت نهایی ثبت شد')
      }
      setPaymentModal({ isOpen: false, request: null, type: '' })
      setPaymentFile(null)
      refetch()
    } catch (error) {
      toast.error(error.userMessage || 'خطا در ثبت پرداخت')
    } finally {
      setIsSubmittingPayment(false)
    }
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
          خطا در دریافت درخواست‌ها
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">درخواست‌های خدمت</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            {isBuyer ? 'درخواست‌های خدمت ثبت شده توسط شما' : 'درخواست‌های ثبت شده برای خدمات شما'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
          <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
            {requests.length} درخواست
          </span>
          {isBuyer && (
            <Link to="/services">
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2 text-sm sm:text-base transition whitespace-nowrap">
                <FiPlus size={16} />
                <span className="hidden sm:inline">درخواست جدید</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-8 sm:py-12">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📋</div>
          <p className="text-gray-500 text-sm sm:text-base mb-3 sm:mb-4">
            {isBuyer ? 'شما هنوز درخواست خدمتی ثبت نکرده‌اید.' : 'هیچ درخواستی برای خدمات شما ثبت نشده است.'}
          </p>
          {isBuyer && (
            <Link to="/services">
              <button className="px-4 sm:px-6 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base">
                مشاهده خدمات و ثبت درخواست
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                {/* محتوای اصلی */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 
                      className="font-semibold text-base sm:text-lg truncate cursor-pointer text-blue-600 hover:underline"
                      onClick={() => handleViewDetails(req.id)}
                    >
                      {req.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[req.status]}
                    </span>
                    {req.urgency === 'critical' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">بحرانی</span>
                    )}
                    {req.force_majeure_declared && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 whitespace-nowrap">
                        <FiAlertTriangle size={12} /> فورس ماژور
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">خدمت: {req.service_title || 'بدون سرویس'}</p>
                  
                  {/* اطلاعات قیمت و تاریخ - اصلاح شده با توابع امن */}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span>📅 {safeFormatDate(req.created_at)}</span>
                    {req.quoted_price && (
                      <span className="font-medium text-green-600">💰 {safeFormatPrice(req.quoted_price)}</span>
                    )}
                    {req.final_price && (
                      <span className="font-medium text-green-600">✅ {safeFormatPrice(req.final_price)}</span>
                    )}
                    {req.advance_payment_required && req.advance_payment_amount && (
                      <span className={`font-medium ${req.advance_payment_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                        {req.advance_payment_paid ? '✅' : '⚠️'} پیش‌پرداخت: {safeFormatPrice(req.advance_payment_amount)}
                      </span>
                    )}
                  </div>
                  
                  {req.provider_notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs sm:text-sm">
                      <span className="font-medium">یادداشت:</span> {req.provider_notes}
                    </div>
                  )}
                  
                  {req.completion_notes && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs sm:text-sm">
                      <span className="font-medium">✅ یادداشت تکمیل:</span> {req.completion_notes}
                    </div>
                  )}
                  
                  {req.completion_images?.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {req.completion_images.slice(0, 3).map((img) => (
                        <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer">
                          <img src={img.image} alt="" className="h-16 w-16 object-cover rounded-lg border" />
                        </a>
                      ))}
                      {req.completion_images.length > 3 && (
                        <span className="text-xs text-gray-500 self-center">+{req.completion_images.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* دکمه‌های عملیات - ریسپانسیو با flex-wrap */}
                <div className="flex flex-row flex-wrap gap-2 border-t pt-3">
                  <button 
                    onClick={() => handleViewDetails(req.id)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1 transition whitespace-nowrap"
                  >
                    <FiEye size={14} /> جزئیات
                  </button>

                  {/* Buyer: پذیرش قیمت */}
                  {isBuyer && req.status === SERVICE_REQUEST_STATUS.QUOTED && (
                    <button 
                      onClick={() => setConfirmModal({ isOpen: true, requestId: req.id })}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiCheck size={14} /> پذیرش قیمت
                    </button>
                  )}

                  {/* Buyer: پرداخت پیش‌پرداخت */}
                  {isBuyer && req.advance_payment_required && !req.advance_payment_paid && req.status === SERVICE_REQUEST_STATUS.ACCEPTED && (
                    <button 
                      onClick={() => setPaymentModal({ isOpen: true, request: req, type: 'advance' })}
                      className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiCreditCard size={14} /> پرداخت پیش‌پرداخت
                    </button>
                  )}

                  {/* Buyer: پرداخت نهایی */}
                  {isBuyer && req.status === SERVICE_REQUEST_STATUS.COMPLETED && (
                    <button 
                      onClick={() => setPaymentModal({ isOpen: true, request: req, type: 'final' })}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiCreditCard size={14} /> پرداخت نهایی
                    </button>
                  )}

                  {/* Buyer: ویرایش */}
                  {isBuyer && req.status === SERVICE_REQUEST_STATUS.PENDING && (
                    <button 
                      onClick={() => setEditModal({ isOpen: true, request: req })}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiEdit2 size={14} /> ویرایش
                    </button>
                  )}

                  {/* Buyer: امتیازدهی */}
                  {isBuyer && req.status === SERVICE_REQUEST_STATUS.COMPLETED && !req.buyer_rating && (
                    <button 
                      onClick={() => { setReviewModal({ isOpen: true, request: req }); setReviewRating(5); }}
                      className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiStar size={14} /> امتیازدهی
                    </button>
                  )}

                  {/* Provider: اعلام قیمت */}
                  {isProvider && (req.status === SERVICE_REQUEST_STATUS.PENDING || req.status === SERVICE_REQUEST_STATUS.REVIEWED) && (
                    <button 
                      onClick={() => setQuoteModal({ isOpen: true, request: req })}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiEdit3 size={14} /> اعلام قیمت
                    </button>
                  )}

                  {/* Provider: شروع کار */}
                  {isProvider && req.status === SERVICE_REQUEST_STATUS.ACCEPTED && (
                    <button 
                      onClick={() => startWork(req.id)} 
                      disabled={isStarting}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiPlay size={14} /> {isStarting ? '...' : 'شروع کار'}
                    </button>
                  )}

                  {/* Provider: فورس ماژور */}
                  {isProvider && (req.status === SERVICE_REQUEST_STATUS.ACCEPTED || req.status === SERVICE_REQUEST_STATUS.IN_PROGRESS) && (
                    <button 
                      onClick={() => setForceMajeureModal({ isOpen: true, request: req })}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiAlertTriangle size={14} /> فورس ماژور
                    </button>
                  )}

                  {/* Provider: تکمیل خدمت */}
                  {isProvider && req.status === SERVICE_REQUEST_STATUS.IN_PROGRESS && (
                    <button 
                      onClick={() => setCompletionModal({ isOpen: true, request: req })}
                      disabled={isCompleting}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <FiFlag size={14} /> {isCompleting ? '...' : 'تکمیل خدمت'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals - بدون تغییر */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3 sm:mb-4">تایید پذیرش قیمت</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">آیا از پذیرش قیمت پیشنهادی اطمینان دارید؟</p>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, requestId: null })} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">انصراف</button>
              <button onClick={() => handleAcceptQuote(confirmModal.requestId)} disabled={isAccepting} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm">
                {isAccepting ? 'در حال...' : 'بله، قبول دارم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentModal.isOpen && paymentModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full my-8">
            <h3 className="text-lg font-bold mb-3 sm:mb-4">{paymentModal.type === 'advance' ? 'پرداخت پیش‌پرداخت' : 'پرداخت نهایی'}</h3>
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg mb-3 sm:mb-4">
              <p className="font-medium text-sm sm:text-base">{paymentModal.request.title}</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1 sm:mt-2">
                {safeFormatPrice(paymentModal.type === 'advance' ? paymentModal.request.advance_payment_amount : paymentModal.request.final_price || paymentModal.request.quoted_price)}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg text-xs sm:text-sm mb-3 sm:mb-4">
              <p className="font-medium mb-2">اطلاعات حساب:</p>
              <p className="break-all">شماره کارت: ۵۸۵۹-۸۳۱۸-۲۵۹۲-۴۴۶۶</p>
              <p>شماره حساب: 9703529361 بانک تجارت</p>
              <p className="break-all">شبا: IR850180000000009703529361</p>
              <p>به نام: سعید سمندی جان</p>
            </div>
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium mb-2">📎 آپلود رسید پرداخت</label>
              <div className="border-2 border-dashed rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:border-blue-500 transition" onClick={() => fileRef.current?.click()}>
                <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf" onChange={(e) => setPaymentFile(e.target.files[0])} />
                {paymentFile ? (
                  <div className="text-green-600">
                    <FiCheck className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" />
                    <p className="text-xs sm:text-sm mt-1 break-all">{paymentFile.name}</p>
                  </div>
                ) : (
                  <div>
                    <FiUpload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-500">کلیک کنید یا فایل رسید را اینجا رها کنید</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button onClick={() => { setPaymentModal({ isOpen: false, request: null, type: '' }); setPaymentFile(null); }} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">انصراف</button>
              <button onClick={handlePaymentUpload} disabled={!paymentFile || isSubmittingPayment} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm">
                {isSubmittingPayment ? 'در حال ثبت...' : 'ثبت پرداخت'}
              </button>
            </div>
          </div>
        </div>
      )}

      {forceMajeureModal.isOpen && forceMajeureModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3 sm:mb-4">اعلام فورس ماژور</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">دلیل فورس ماژور</label>
              <textarea value={forceMajeureReason} onChange={(e) => setForceMajeureReason(e.target.value)} rows={3}
                className="w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="دلیل تغییر شرایط را توضیح دهید..." />
            </div>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button onClick={() => setForceMajeureModal({ isOpen: false, request: null })} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">انصراف</button>
              <button onClick={handleForceMajeure} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">ثبت فورس ماژور</button>
            </div>
          </div>
        </div>
      )}

      {reviewModal.isOpen && reviewModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3 sm:mb-4">ثبت امتیاز و نظر</h3>
            <div className="space-y-4 text-center">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} type="button" className="focus:outline-none">
                    <FiStar className={`h-6 w-6 sm:h-8 sm:w-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3}
                className="w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="نظر خود را بنویسید..." />
            </div>
            <div className="flex justify-end gap-2 sm:gap-3 mt-4">
              <button onClick={() => setReviewModal({ isOpen: false, request: null })} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">انصراف</button>
              <button onClick={handleSubmitReview} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">ثبت امتیاز</button>
            </div>
          </div>
        </div>
      )}

      {/* فرم‌های Modal */}
      <ServiceRequestUpdateForm isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, request: null })}
        request={editModal.request} onUpdate={() => { setEditModal({ isOpen: false, request: null }); refetch(); }} />

      <ProviderQuoteForm isOpen={quoteModal.isOpen} onClose={() => setQuoteModal({ isOpen: false, request: null })}
        request={quoteModal.request} onSuccess={() => { setQuoteModal({ isOpen: false, request: null }); refetch(); }} />

      <ServiceCompletionForm isOpen={completionModal.isOpen} onClose={() => setCompletionModal({ isOpen: false, request: null })}
        request={completionModal.request} onSuccess={() => { setCompletionModal({ isOpen: false, request: null }); refetch(); }} />
    </div>
  )
}