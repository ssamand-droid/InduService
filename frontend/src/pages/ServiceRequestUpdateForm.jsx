// InduService\frontend\src\pages\ServiceRequestUpdateForm.jsx

import { useState } from 'react'
import { FiCheck, FiX, FiDollarSign, FiClock } from 'react-icons/fi'
import { Button, Modal } from '@components/ui'
import { FormInput, FormTextarea, FormSelect } from '@components/forms'
import { serviceApi } from '../services/serviceApi'
import toast from 'react-hot-toast'

// تابع امن فرمت قیمت
const safeFormatPriceForDisplay = (price) => {
  if (!price && price !== 0) return '۰'
  const num = Number(price)
  if (isNaN(num)) return '۰'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
}

const statusOptions = [
  { value: 'reviewed', label: 'بررسی شده' },
  { value: 'quoted', label: 'اعلام قیمت' },
  { value: 'rejected', label: 'رد درخواست' },
  { value: 'in_progress', label: 'شروع کار' },
  { value: 'completed', label: 'تکمیل شده' },
]

/**
 * فرم بروزرسانی وضعیت درخواست خدمت توسط ارائه‌دهنده
 */
export const ServiceRequestUpdateForm = ({ request, isOpen, onClose, onUpdate }) => {
  const [status, setStatus] = useState(request?.status || 'reviewed')
  const [quotedPrice, setQuotedPrice] = useState(request?.quoted_price || '')
  const [notes, setNotes] = useState(request?.provider_notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (status === 'quoted' && !quotedPrice) {
      toast.error('لطفاً قیمت پیشنهادی را وارد کنید')
      return
    }

    // اعتبارسنجی قیمت
    if (status === 'quoted' && quotedPrice) {
      const priceNum = Number(quotedPrice)
      if (isNaN(priceNum) || priceNum <= 0) {
        toast.error('لطفاً قیمت معتبر وارد کنید')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await serviceApi.updateServiceRequest(request.id, {
        status,
        quoted_price: status === 'quoted' ? parseInt(quotedPrice) : null,
        provider_notes: notes,
      })
      toast.success('وضعیت درخواست با موفقیت بروزرسانی شد')
      onUpdate?.()
      onClose()
    } catch (error) {
      toast.error(error.userMessage || 'خطا در بروزرسانی درخواست')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`بروزرسانی درخواست: ${request?.title || ''}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            <FiX className="ml-1" /> انصراف
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} loadingText="در حال ذخیره...">
            <FiCheck className="ml-1" /> ذخیره تغییرات
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* انتخاب وضعیت */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت جدید</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* قیمت پیشنهادی (فقط در صورت اعلام قیمت) */}
        {status === 'quoted' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              قیمت پیشنهادی (ریال) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="مثلاً 50000000"
                className="w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">مبلغ را به ریال وارد کنید</p>
          </div>
        )}

        {/* یادداشت */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت (اختیاری)</label>
          <div className="relative">
            <FiClock className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="توضیحات تکمیلی برای مشتری..."
              rows={4}
              className="w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* نمایش قیمت فعلی در صورت وجود */}
        {request?.quoted_price && status !== 'quoted' && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">قیمت فعلی: </span>
            <span className="font-medium text-green-600">{safeFormatPriceForDisplay(request.quoted_price)} ریال</span>
          </div>
        )}
      </div>
    </Modal>
  )
}