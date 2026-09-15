// src/features/services/components/ProviderQuoteForm.jsx

import { useState } from 'react'
import { FiCheck, FiX, FiDollarSign, FiCalendar, FiAlertTriangle } from 'react-icons/fi'
import { Button, Modal } from '@components/ui'
import { serviceApi } from '../services/serviceApi'
import toast from 'react-hot-toast'

// تابع فرمت قیمت با هزارگان برای نمایش
const formatPriceWithCommas = (price) => {
  if (!price) return ''
  const num = Number(price)
  if (isNaN(num)) return ''
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
}

export const ProviderQuoteForm = ({ isOpen, onClose, request, onSuccess }) => {
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [advanceRequired, setAdvanceRequired] = useState(false)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
      if (!price) { toast.error('قیمت را وارد کنید'); return }

      if (advanceRequired && !advanceAmount) {
          toast.error('مبلغ پیش‌پرداخت را وارد کنید')
          return
      }

      setIsSubmitting(true)
      try {
          const date = new Date()
          date.setDate(date.getDate() + parseInt(estimatedDays || 7))

          const payload = {
              quoted_price: parseInt(price),
              provider_notes: notes,
              estimated_completion_date: date.toISOString().split('T')[0],
              advance_payment_required: advanceRequired,
          }

          if (advanceRequired && advanceAmount) {
              payload.advance_payment_amount = parseInt(advanceAmount)
          }

          await serviceApi.providerQuote(request.id, payload)

          toast.success('قیمت با موفقیت اعلام شد')
          onSuccess?.()
          onClose()
      } catch (error) {
          toast.error(error.userMessage || 'خطا در اعلام قیمت')
      } finally {
          setIsSubmitting(false)
      }
  }

  // محاسبه درصد پیش‌پرداخت
  const advancePercentage = price && advanceAmount
    ? Math.round((parseInt(advanceAmount) / parseInt(price)) * 100)
    : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="اعلام قیمت و شرایط" size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}><FiX className="ml-1" /> انصراف</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} loadingText="در حال ثبت...">
            <FiCheck className="ml-1" /> ثبت قیمت
          </Button>
        </>
      }>
      <div className="space-y-4">
        {/* قیمت */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <FiDollarSign className="text-green-500" /> قیمت پیشنهادی (ریال) *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="مثلاً 50000000"
          />
          {price && (
            <p className="text-xs text-gray-500 mt-1">
              {formatPriceWithCommas(price)} ریال
            </p>
          )}
        </div>

        {/* مدت زمان */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <FiCalendar className="text-blue-500" /> مدت زمان تخمینی (روز)
          </label>
          <input
            type="number"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="مثلاً ۷"
          />
        </div>

        {/* یادداشت */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت برای مشتری</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            placeholder="توضیحات..."
          />
        </div>

        {/* پیش‌پرداخت */}
        <div className="border border-gray-200 rounded-lg p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={advanceRequired}
              onChange={(e) => setAdvanceRequired(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium flex items-center gap-1 text-gray-700">
              <FiAlertTriangle className="text-yellow-500" /> نیاز به پیش‌پرداخت
            </span>
          </label>
          {advanceRequired && (
            <div className="mt-3">
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="مبلغ پیش‌پرداخت"
              />
              {advanceAmount && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatPriceWithCommas(advanceAmount)} ریال ({advancePercentage}% از مبلغ کل)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}