// src/features/wizard/ServiceWizard.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { SERVICE_TYPES, SERVICE_SCENARIO_MAP } from './serviceTypes'
import {
  AssetStep, ProblemStep, SymptomsStep, HistoryStep,
  ElectricalDetailStep, PartInfoStep, MaterialStep,
  QuantityStep, SpecsStep, UrgencyStep, LocationStep,
  ScenarioStep, MediaStep,
} from './steps'
import assetService from '@services/assetService'
import { serviceApi } from '@features/services/services/serviceApi'


const STEP_LABELS = {
  scenario: 'نوع خدمت دقیق',
  asset: 'دستگاه',
  problem: 'شرح مشکل',
  symptoms: 'علائم',
  history: 'تاریخچه',
  electrical_detail: 'جزئیات برق',
  part_info: 'اطلاعات قطعه',
  material: 'متریال',
  specs: 'مشخصات',
  quantity: 'تعداد',
  location: 'موقعیت',
  urgency: 'فوریت',
  media: 'تصاویر',
  confirm: 'تأیید',
}

const colorMap = {
  blue:   { active: 'bg-blue-600',   bar: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  purple: { active: 'bg-purple-600', bar: 'bg-purple-500', pill: 'bg-purple-50 text-purple-700 border-purple-200' },
  yellow: { active: 'bg-amber-500',  bar: 'bg-amber-400',  pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  slate:  { active: 'bg-slate-700',  bar: 'bg-slate-500',  pill: 'bg-slate-100 text-slate-700 border-slate-300' },
  green:  { active: 'bg-emerald-600',bar: 'bg-emerald-500',pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  orange: { active: 'bg-orange-500', bar: 'bg-orange-400', pill: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default function ServiceWizard({ initialServiceType = null, initialAssetId = null }) {
  const navigate = useNavigate()

  const [serviceType, setServiceType]   = useState(initialServiceType)
  const [stepIndex, setStepIndex]       = useState(0)
  const [loading, setLoading]           = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [submittedId, setSubmittedId]   = useState(null)
  const [noMatch, setNoMatch]           = useState(false)

  const [assets, setAssets]             = useState([])
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assetSearch, setAssetSearch]   = useState('')

  const [stepData, setStepData] = useState({ urgency: 'medium', unit: 'عدد' })
  const [errors, setErrors]     = useState({})

  const [attachments, setAttachments]   = useState([])
  const [previewUrls, setPreviewUrls]   = useState([])

  const currentType  = serviceType ? SERVICE_TYPES[serviceType] : null
  const steps        = currentType?.steps || []
  const currentStep  = steps[stepIndex]
  const color        = currentType ? colorMap[currentType.color] : colorMap.blue
  const progress     = steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0

  useEffect(() => {
    assetService.getAssets()
      .then(r => setAssets(r.data?.results || r.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (initialAssetId) {
      assetService.getAsset(initialAssetId)
        .then(r => setSelectedAsset(r.data))
        .catch(() => {})
    }
  }, [initialAssetId])

  const update = useCallback((key, val) => {
    setStepData(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: null }))
  }, [])

  const addFiles = (files) => {
    const merged = [...attachments, ...files].slice(0, 5)
    setAttachments(merged)
    files.slice(0, 5 - attachments.length).forEach(f =>
      setPreviewUrls(prev => [...prev, URL.createObjectURL(f)].slice(0, 5))
    )
  }

  const removeFile = (i) => {
    URL.revokeObjectURL(previewUrls[i])
    setAttachments(p => p.filter((_, x) => x !== i))
    setPreviewUrls(p => p.filter((_, x) => x !== i))
  }

  const validate = () => {
    const errs = {}
    if (currentStep === 'problem'   && !stepData.description?.trim()) errs.description = 'شرح مشکل الزامی است'
    if (currentStep === 'symptoms'  && !stepData.symptoms?.trim())    errs.symptoms    = 'علائم الزامی است'
    if (currentStep === 'part_info' && !stepData.part_name?.trim())   errs.part_name   = 'نام قطعه الزامی است'
    if (currentStep === 'quantity'  && !stepData.quantity)            errs.quantity    = 'تعداد الزامی است'
    if (currentStep === 'location'  && !stepData.install_location?.trim()) errs.install_location = 'آدرس الزامی است'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => { if (validate() && stepIndex < steps.length - 1) setStepIndex(i => i + 1) }
  const back = () => { if (stepIndex > 0) setStepIndex(i => i - 1); else setServiceType(null) }

  const buildPayload = () => {
    const typeLabel    = currentType?.label || ''
    const detail       = stepData.part_name || stepData.description?.slice(0, 50) || stepData.symptoms?.slice(0, 50) || ''
    const title        = `${typeLabel}${detail ? ' - ' + detail : ''}`
    const scenarioKey  = stepData.scenario || SERVICE_SCENARIO_MAP[serviceType]?.[0] || ''

    const descParts = [
      stepData.description,
      stepData.symptoms && `علائم: ${stepData.symptoms}`,
      stepData.since_when && `از: ${stepData.since_when}`,
      stepData.actions_taken && `اقدامات قبلی: ${stepData.actions_taken}`,
      stepData.operating_conditions && `شرایط: ${stepData.operating_conditions}`,
      stepData.electrical_description,
      stepData.part_name && `قطعه: ${stepData.part_name}`,
      stepData.extra_notes,
    ].filter(Boolean).join('\n')

    const equipParts = [
      selectedAsset?.brand && `برند: ${selectedAsset.brand}`,
      selectedAsset?.model_number && `مدل: ${selectedAsset.model_number}`,
      selectedAsset?.serial_number && `سریال: ${selectedAsset.serial_number}`,
      selectedAsset?.location && `موقعیت: ${selectedAsset.location}`,
    ].filter(Boolean).join('\n')

    const extraKeys = [
      'electrical_type', 'voltage', 'power_rating', 'material', 'processes',
      'tolerance', 'part_number', 'machine_brand', 'quantity', 'unit',
      'part_quality', 'country_of_origin', 'install_location', 'environment_type',
      'prev_repair', 'operating_conditions', 'since_when',
    ]
    const extraData = {}
    extraKeys.forEach(k => { if (stepData[k]) extraData[k] = stepData[k] })

    const fd = new FormData()
    fd.append('title',       title)
    fd.append('description', descParts)
    fd.append('urgency',     stepData.urgency || 'medium')
    fd.append('service_type', serviceType)
    if (scenarioKey)     fd.append('service_scenario', scenarioKey)
    if (selectedAsset?.id) fd.append('related_asset', selectedAsset.id)
    if (equipParts)      fd.append('equipment_details', equipParts)
    if (stepData.desired_date || stepData.delivery_deadline)
      fd.append('desired_start_date', stepData.desired_date || stepData.delivery_deadline)
    if (Object.keys(extraData).length)
      fd.append('extra_data', JSON.stringify(extraData))
    attachments.forEach(f => fd.append('attachments', f))
    return { fd, title, descParts }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { fd, title, descParts } = buildPayload()

      // تلاش برای match
      let matchedId = null
      try {
        const m = await serviceApi.matchService?.({ title, description: descParts })
        matchedId = m?.service_id || null
      } catch (_) {}
      if (matchedId) fd.append('service', matchedId)

      const res = await serviceApi.createServiceRequest(fd)
      setSubmittedId(res?.id)
      setNoMatch(!matchedId)
      setSubmitted(true)
      toast.success('درخواست با موفقیت ثبت شد')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || e.userMessage || 'خطا در ثبت درخواست')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setSubmitted(false); setServiceType(null); setStepIndex(0)
    setStepData({ urgency: 'medium', unit: 'عدد' }); setAttachments([]); setPreviewUrls([])
    setSelectedAsset(null)
  }

  // ─── صفحه موفقیت ─────────────────────────────────────────────
  if (submitted) return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className={`w-20 h-20 ${noMatch ? 'bg-yellow-50' : 'bg-green-50'} rounded-full flex items-center justify-center mx-auto mb-5`}>
          {noMatch
            ? <AlertTriangle className="text-yellow-500" size={36} />
            : <CheckCircle className="text-green-600" size={36} />}
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {noMatch ? 'درخواست ثبت شد' : 'ثبت شد!'}
        </h2>
        <p className="text-sm text-slate-500 mb-1">
          {noMatch
            ? 'تیم پشتیبان به زودی با شما تماس می‌گیرد.'
            : 'تأمین‌کنندگان پیشنهادات خود را ارسال خواهند کرد.'}
        </p>
        {submittedId && <p className="text-xs text-slate-400 mb-5">شماره: #{submittedId}</p>}
        <div className="flex flex-col gap-2">
          <button onClick={() => navigate('/dashboard/service-requests')}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition">
            مشاهده درخواست‌ها
          </button>
          <button onClick={resetAll} className="text-sm text-slate-500 hover:text-slate-800 py-2 transition">
            درخواست جدید
          </button>
        </div>
      </div>
    </div>
  )

  // ─── انتخاب نوع خدمت ─────────────────────────────────────────
  if (!serviceType) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">درخواست خدمت جدید</h1>
        <p className="text-sm text-slate-500 mt-1">نوع خدمت را انتخاب کنید</p>
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">نوع خدمت</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.values(SERVICE_TYPES).map(type => (
          <button key={type.id} onClick={() => { setServiceType(type.id); setStepIndex(0) }}
            className="text-right p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:shadow-sm transition group">
            <span className="text-3xl block mb-3">{type.icon}</span>
            <p className="font-bold text-slate-800 text-sm">{type.label}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── ویزارد مراحل ────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      {/* هدر + progress */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={back} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 shrink-0">
          <ArrowRight size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{currentType.icon}</span>
            <p className="font-bold text-slate-900 text-sm truncate">{currentType.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${color.bar} rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-slate-400 shrink-0">{stepIndex + 1}/{steps.length}</span>
          </div>
        </div>
      </div>

      {/* کارت مرحله */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          {STEP_LABELS[currentStep]}
        </p>

        {currentStep === 'scenario' && (
          <ScenarioStep
            serviceType={serviceType}
            value={stepData.scenario || ''}
            onChange={v => update('scenario', v)}
          />
        )}
        {currentStep === 'asset' && (
          <AssetStep
            assets={assets} selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset} onClearAsset={() => setSelectedAsset(null)}
            assetSearch={assetSearch} onSearchChange={setAssetSearch}
          />
        )}
        {currentStep === 'problem' && (
          <ProblemStep
            value={stepData.description || ''} onChange={v => update('description', v)}
            error={errors.description}
          />
        )}
        {currentStep === 'symptoms'         && <SymptomsStep data={stepData} onChange={update} />}
        {currentStep === 'history'          && <HistoryStep data={stepData} onChange={update} />}
        {currentStep === 'electrical_detail'&& <ElectricalDetailStep data={stepData} onChange={update} />}
        {currentStep === 'part_info'        && <PartInfoStep data={stepData} onChange={update} serviceType={serviceType} />}
        {currentStep === 'material'         && <MaterialStep data={stepData} onChange={update} />}
        {currentStep === 'specs'            && <SpecsStep data={stepData} onChange={update} />}
        {currentStep === 'quantity'         && <QuantityStep data={stepData} onChange={update} />}
        {currentStep === 'location'         && <LocationStep data={stepData} onChange={update} />}
        {currentStep === 'urgency' && (
          <UrgencyStep
            urgency={stepData.urgency} onUrgencyChange={v => update('urgency', v)}
            desiredDate={stepData.desired_date || ''} onDateChange={v => update('desired_date', v)}
          />
        )}
        {currentStep === 'media' && (
          <MediaStep
            attachments={attachments} previewUrls={previewUrls}
            onFilesAdd={addFiles} onRemove={removeFile}
          />
        )}
        {currentStep === 'confirm' && (
          <ConfirmStep
            serviceType={currentType} stepData={stepData}
            selectedAsset={selectedAsset} attachments={attachments}
          />
        )}
      </div>

      {/* ناوبری */}
      <div className="flex gap-3">
        {stepIndex > 0 && (
          <button onClick={back}
            className="px-5 py-3 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition text-sm font-medium flex items-center gap-1.5">
            <ArrowRight size={15} /> قبلی
          </button>
        )}
        {currentStep !== 'confirm' ? (
          <button onClick={next}
            className={`flex-1 py-3 ${color.active} text-white rounded-2xl font-medium text-sm hover:opacity-90 transition flex items-center justify-center gap-1.5`}>
            {currentStep === 'media' ? 'بررسی نهایی' : 'بعدی'} <ArrowLeft size={15} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className={`flex-1 py-3 ${color.active} text-white rounded-2xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2`}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> در حال ثبت...</>
              : '✅ ثبت درخواست'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── خلاصه تأیید ─────────────────────────────────────────────
function ConfirmStep({ serviceType, stepData, selectedAsset, attachments }) {
  const urgencyLabel = { low: 'کم', medium: 'متوسط', high: 'زیاد', critical: 'بحرانی ⚠️' }

  const rows = [
    selectedAsset               && ['دستگاه',       selectedAsset.name],
    stepData.scenario           && ['سناریو',        stepData.scenario],
    stepData.description        && ['مشکل',          stepData.description],
    stepData.symptoms           && ['علائم',         stepData.symptoms],
    stepData.electrical_type    && ['نوع برق‌کاری',  stepData.electrical_type],
    stepData.part_name          && ['قطعه',          stepData.part_name],
    stepData.part_number        && ['Part No.',      stepData.part_number],
    stepData.material           && ['متریال',        stepData.material],
    stepData.quantity           && ['تعداد',         `${stepData.quantity} ${stepData.unit || 'عدد'}`],
    stepData.install_location   && ['آدرس نصب',      stepData.install_location],
    stepData.urgency            && ['فوریت',         urgencyLabel[stepData.urgency]],
    stepData.desired_date       && ['تاریخ مطلوب',   stepData.desired_date],
    stepData.delivery_deadline  && ['مهلت تحویل',    stepData.delivery_deadline],
    attachments.length          && ['فایل',          `${attachments.length} فایل ضمیمه`],
  ].filter(Boolean)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{serviceType.icon}</span>
        <div>
          <p className="font-bold text-slate-800">{serviceType.label}</p>
          <p className="text-xs text-slate-400">خلاصه درخواست شما</p>
        </div>
      </div>
      <div className="space-y-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-slate-400 text-xs w-24 shrink-0 pt-0.5">{k}</span>
            <span className="text-slate-800 text-sm font-medium text-right flex-1 leading-relaxed">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
