// src/features/wizard/ProviderWizard.jsx
import React, { useState } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, ChevronDown } from 'lucide-react'
import { SERVICE_TYPES } from './serviceTypes'
import { serviceApi } from '@features/services/services/serviceApi'
import toast from 'react-hot-toast'

const cls  = 'w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm'
const sels = cls + ' appearance-none cursor-pointer'

const STEPS = ['review', 'offer', 'schedule', 'terms', 'confirm']
const STEP_LABELS = {
  review:   'بررسی درخواست',
  offer:    'پیشنهاد قیمت',
  schedule: 'زمان‌بندی',
  terms:    'شرایط و گارانتی',
  confirm:  'تأیید و ارسال',
}

const URGENCY_FA = { low: 'کم', medium: 'متوسط', high: 'زیاد', critical: '⚠️ بحرانی' }

export default function ProviderWizard({ request, onClose, onSuccess }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [offer, setOffer] = useState({
    quoted_price:              '',
    price_type:                'fixed',
    estimated_days:            '',
    visit_required:            false,
    advance_payment_required:  false,
    advance_payment_amount:    '',
    warranty_months:           3,
    provider_notes:            '',
    can_start:                 'asap',
    start_date:                '',
    parts_included:            false,
    travel_included:           false,
  })

  const up = (key, val) => setOffer(prev => ({ ...prev, [key]: val }))

  const currentStep = STEPS[stepIndex]
  const progress    = ((stepIndex + 1) / STEPS.length) * 100
  const serviceType = request?.service_type ? SERVICE_TYPES[request.service_type] : null

  const validate = () => {
    if (currentStep === 'offer' && !offer.quoted_price) {
      toast.error('قیمت پیشنهادی الزامی است')
      return false
    }
    if (currentStep === 'offer' && offer.advance_payment_required && !offer.advance_payment_amount) {
      toast.error('مبلغ پیش‌پرداخت را وارد کنید')
      return false
    }
    if (currentStep === 'schedule' && !offer.estimated_days) {
      toast.error('مدت زمان تخمینی الزامی است')
      return false
    }
    return true
  }

  const next = () => { if (validate() && stepIndex < STEPS.length - 1) setStepIndex(i => i + 1) }
  const back = () => { if (stepIndex > 0) setStepIndex(i => i - 1) }

  const buildCompletionDate = () => {
    const days = parseInt(offer.estimated_days || 7)
    const date = offer.can_start === 'scheduled' && offer.start_date
      ? new Date(offer.start_date)
      : new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        quoted_price:               parseInt(offer.quoted_price),
        provider_notes:             [
          offer.provider_notes,
          offer.parts_included  ? '✓ قطعات شامل قیمت' : '✗ قطعات جداگانه',
          offer.travel_included ? '✓ ایاب و ذهاب شامل قیمت' : '',
          offer.visit_required  ? '✓ نیاز به بازدید اولیه' : '',
          offer.can_start === 'scheduled' && offer.start_date ? `تاریخ شروع: ${offer.start_date}` : '',
        ].filter(Boolean).join('\n'),
        estimated_completion_date:  buildCompletionDate(),
        advance_payment_required:   offer.advance_payment_required,
        ...(offer.advance_payment_required && { advance_payment_amount: parseInt(offer.advance_payment_amount) }),
      }
      await serviceApi.providerQuote(request.id, payload)
      setSubmitted(true)
      toast.success('پیشنهاد شما با موفقیت ارسال شد')
      onSuccess?.()
    } catch (e) {
      toast.error(e.response?.data?.message || e.userMessage || 'خطا در ارسال پیشنهاد')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div className="text-center py-10 px-6">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="text-emerald-600" size={32} />
      </div>
      <h2 className="font-bold text-slate-800 mb-1">پیشنهاد ارسال شد!</h2>
      <p className="text-sm text-slate-500 mb-6">در صورت انتخاب، اطلاع‌رسانی خواهید شد.</p>
      <button onClick={onClose}
        className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition">
        بستن
      </button>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto">
      {/* progress */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600">{STEP_LABELS[currentStep]}</span>
          <span className="text-xs text-slate-400">{stepIndex + 1} / {STEPS.length}</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ─── مرحله ۱: بررسی درخواست ─── */}
        {currentStep === 'review' && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              {[
                ['عنوان',    request?.title],
                ['نوع خدمت', serviceType?.label || request?.service_type],
                ['سناریو',   request?.service_scenario],
                ['صنعت',     request?.industry],
                ['فوریت',    URGENCY_FA[request?.urgency]],
                ['تاریخ',    request?.created_at?.slice(0, 10)],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-slate-400 text-xs w-20 shrink-0 mt-0.5">{k}</span>
                  <span className="text-slate-800 text-sm font-medium">{v}</span>
                </div>
              ))}
            </div>
            {request?.description && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5">شرح مشکل</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed whitespace-pre-line">
                  {request.description}
                </p>
              </div>
            )}
            {request?.equipment_details && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5">اطلاعات دستگاه</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 whitespace-pre-line">
                  {request.equipment_details}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── مرحله ۲: پیشنهاد قیمت ─── */}
        {currentStep === 'offer' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">نوع قیمت‌گذاری</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'fixed',    l: 'مقطوع' },
                  { v: 'hourly',   l: 'ساعتی' },
                  { v: 'quotation',l: 'تخمینی' },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => up('price_type', opt.v)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                      offer.price_type === opt.v
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                مبلغ (ریال) <span className="text-red-500">*</span>
              </label>
              <input type="number" value={offer.quoted_price} onChange={e => up('quoted_price', e.target.value)}
                placeholder={offer.price_type === 'hourly' ? 'مبلغ به ازای هر ساعت' : 'مبلغ کل'}
                className={cls} />
              {offer.quoted_price && (
                <p className="text-xs text-slate-400 mt-1">
                  معادل: {Number(offer.quoted_price).toLocaleString('fa')} ریال
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">آیا قطعات شامل قیمت می‌شود؟</label>
              <TogglePair
                value={offer.parts_included}
                onChange={v => up('parts_included', v)}
                yes="بله — شامل قیمت" no="خیر — جداگانه"
                color="emerald"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">آیا بازدید اولیه نیاز است؟</label>
              <TogglePair
                value={offer.visit_required}
                onChange={v => up('visit_required', v)}
                yes="بله" no="خیر"
                color="blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">پیش‌پرداخت نیاز دارید؟</label>
              <TogglePair
                value={offer.advance_payment_required}
                onChange={v => up('advance_payment_required', v)}
                yes="بله" no="خیر"
                color="orange"
              />
              {offer.advance_payment_required && (
                <input type="number" value={offer.advance_payment_amount}
                  onChange={e => up('advance_payment_amount', e.target.value)}
                  placeholder="مبلغ پیش‌پرداخت (ریال)"
                  className={`${cls} mt-2`}
                />
              )}
            </div>
          </div>
        )}

        {/* ─── مرحله ۳: زمان‌بندی ─── */}
        {currentStep === 'schedule' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                مدت زمان انجام کار (روز) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="1" value={offer.estimated_days}
                onChange={e => up('estimated_days', e.target.value)}
                placeholder="مثال: ۳"
                className={cls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">زمان شروع</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: 'asap',      l: 'در اسرع وقت' },
                  { v: 'scheduled', l: 'تاریخ مشخص' },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => up('can_start', opt.v)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                      offer.can_start === opt.v
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {opt.l}
                  </button>
                ))}
              </div>
              {offer.can_start === 'scheduled' && (
                <input type="date" value={offer.start_date}
                  onChange={e => up('start_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`${cls} mt-2`}
                />
              )}
            </div>
          </div>
        )}

        {/* ─── مرحله ۴: شرایط ─── */}
        {currentStep === 'terms' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">مدت گارانتی</label>
              <div className="relative">
                <select value={offer.warranty_months} onChange={e => up('warranty_months', Number(e.target.value))} className={sels}>
                  {[0, 1, 3, 6, 12, 24].map(m => (
                    <option key={m} value={m}>{m === 0 ? 'بدون گارانتی' : `${m} ماه`}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">هزینه ایاب و ذهاب</label>
              <TogglePair
                value={offer.travel_included}
                onChange={v => up('travel_included', v)}
                yes="شامل قیمت" no="جداگانه / رایگان"
                color="slate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">یادداشت / شرایط خاص</label>
              <textarea value={offer.provider_notes} onChange={e => up('provider_notes', e.target.value)}
                placeholder="هر توضیح یا شرطی که خریدار باید بداند..."
                rows={3}
                className={`${cls} resize-none`}
              />
            </div>
          </div>
        )}

        {/* ─── مرحله ۵: تأیید ─── */}
        {currentStep === 'confirm' && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              {[
                ['قیمت', `${Number(offer.quoted_price).toLocaleString('fa')} ریال (${
                  { fixed: 'مقطوع', hourly: 'ساعتی', quotation: 'تخمینی' }[offer.price_type]
                })`],
                ['مدت اجرا', `${offer.estimated_days} روز`],
                ['اتمام تخمینی', buildCompletionDate()],
                ['زمان شروع', offer.can_start === 'asap' ? 'در اسرع وقت' : offer.start_date],
                ['گارانتی', offer.warranty_months === 0 ? 'بدون گارانتی' : `${offer.warranty_months} ماه`],
                ['قطعات', offer.parts_included ? 'شامل قیمت ✓' : 'جداگانه'],
                ['ایاب و ذهاب', offer.travel_included ? 'شامل قیمت ✓' : 'جداگانه'],
                ['بازدید اولیه', offer.visit_required ? 'نیاز دارد' : 'ندارد'],
                offer.advance_payment_required && ['پیش‌پرداخت', `${Number(offer.advance_payment_amount).toLocaleString('fa')} ریال`],
                offer.provider_notes && ['یادداشت', offer.provider_notes],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-slate-400 text-xs w-28 shrink-0 mt-0.5">{k}</span>
                  <span className="text-slate-800 text-sm font-medium leading-relaxed">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* دکمه‌های ناوبری */}
        <div className="flex gap-3 pt-2">
          {stepIndex > 0 && (
            <button onClick={back}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition text-sm flex items-center gap-1.5">
              <ArrowRight size={15} /> قبلی
            </button>
          )}
          {currentStep !== 'confirm' ? (
            <button onClick={next}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-1.5">
              بعدی <ArrowLeft size={15} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> ارسال...</>
                : '📤 ارسال پیشنهاد'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── کامپوننت کمکی: toggle دوگزینه‌ای ───────────────────────
function TogglePair({ value, onChange, yes, no, color = 'blue' }) {
  const activeMap = {
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    blue:    'border-blue-500 bg-blue-50 text-blue-700',
    orange:  'border-orange-500 bg-orange-50 text-orange-700',
    slate:   'border-slate-700 bg-slate-800 text-white',
  }
  const active = activeMap[color] || activeMap.blue
  const base   = 'border-slate-200 text-slate-600 hover:border-slate-300'

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)}
        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${value === true ? active : base}`}>
        {yes}
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${value === false ? active : base}`}>
        {no}
      </button>
    </div>
  )
}
