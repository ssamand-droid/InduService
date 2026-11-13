// src/features/wizard/steps/index.jsx
import React, { useRef } from 'react'
import { Package, Search, X, Camera, Image, Plus, ChevronDown } from 'lucide-react'
import {
  URGENCY_OPTIONS, ELECTRICAL_TYPES, MATERIAL_TYPES,
  MANUFACTURE_PROCESSES, SCENARIO_OPTIONS,
} from '../serviceTypes'

const cls  = 'w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm'
const sels = cls + ' appearance-none cursor-pointer'

// ─── انتخاب سناریو ───────────────────────────────────────────
export const ScenarioStep = ({ serviceType, value, onChange }) => {
  const options = SCENARIO_OPTIONS[serviceType] || []
  if (!options.length) return null
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500 mb-3">نوع دقیق‌تر خدمت مورد نیاز خود را انتخاب کنید:</p>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full text-right p-4 rounded-xl border-2 transition text-sm font-medium ${
            value === opt.value
              ? 'border-blue-500 bg-blue-50 text-blue-800'
              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-slate-400 hover:text-slate-600 pt-1"
        >
          بازنشانی انتخاب
        </button>
      )}
    </div>
  )
}

// ─── انتخاب دستگاه ───────────────────────────────────────────
export const AssetStep = ({ assets, selectedAsset, onSelectAsset, onClearAsset, assetSearch, onSearchChange }) => {
  const [open, setOpen] = React.useState(false)
  const filtered = assets.filter(a =>
    a.name?.includes(assetSearch) ||
    a.tag_number?.includes(assetSearch) ||
    a.location?.includes(assetSearch)
  )

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">دستگاه یا تجهیز مرتبط</label>
      {selectedAsset ? (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600 shrink-0" size={20} />
            <div>
              <p className="font-bold text-slate-800 text-sm">{selectedAsset.name}</p>
              <p className="text-xs text-slate-500">{selectedAsset.tag_number} · {selectedAsset.location}</p>
            </div>
          </div>
          <button type="button" onClick={onClearAsset} className="text-slate-400 hover:text-red-500 p-1">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition text-sm"
          >
            <Search size={16} />
            <span>جست‌وجو میان ماشین‌آلات و تجهیزات ثبت‌شده (اختیاری)</span>
          </button>
          {open && (
            <div className="absolute top-full right-0 left-0 mt-1 border border-slate-200 rounded-xl bg-white shadow-lg z-10 overflow-hidden">
              <input
                autoFocus
                value={assetSearch}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="نام دستگاه یا شماره تگ..."
                className="w-full px-4 py-2.5 border-b border-slate-100 text-sm focus:outline-none"
              />
              <div className="max-h-52 overflow-y-auto">
                {filtered.length === 0
                  ? <p className="text-center text-sm text-slate-400 py-4">دستگاهی یافت نشد</p>
                  : filtered.map(asset => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => { onSelectAsset(asset); setOpen(false) }}
                      className="w-full px-4 py-3 text-right hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0 transition"
                    >
                      <Package size={16} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{asset.name}</p>
                        <p className="text-xs text-slate-500">{asset.tag_number} · {asset.location}</p>
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {selectedAsset && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            ['برند',      selectedAsset.brand],
            ['مدل',       selectedAsset.model_number],
            ['سریال',     selectedAsset.serial_number],
            ['سال ساخت',  selectedAsset.year_of_manufacture],
            ['موقعیت',    selectedAsset.location],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-slate-400 text-xs">{k}</p>
              <p className="font-semibold text-slate-800 text-sm">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── شرح مشکل ────────────────────────────────────────────────
export const ProblemStep = ({ value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      مشکل را شرح دهید <span className="text-red-500">*</span>
    </label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="مثال: لرزش غیرعادی پمپ، صدای بلبرینگ، کاهش فشار خروجی، خطای E07 روی نمایشگر..."
      rows={4}
      className={`${cls} resize-none ${error ? 'border-red-300 ring-1 ring-red-200' : ''}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    <p className="text-xs text-slate-400 mt-1">{value.length} / ۵۰۰</p>
  </div>
)

// ─── علائم (عیب‌یابی) ────────────────────────────────────────
export const SymptomsStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        علائم مشاهده‌شده <span className="text-red-500">*</span>
      </label>
      <textarea
        value={data.symptoms || ''}
        onChange={e => onChange('symptoms', e.target.value)}
        placeholder="صدای غیرعادی، لرزش، دمای بالا، خطا، کاهش راندمان..."
        rows={3}
        className={`${cls} resize-none`}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">از چه زمانی شروع شد؟</label>
      <input
        type="text"
        value={data.since_when || ''}
        onChange={e => onChange('since_when', e.target.value)}
        placeholder="مثال: ۳ روز پیش، بعد از سرویس اخیر، تدریجی طی یک ماه..."
        className={cls}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">آیا قبلاً تعمیر شده؟</label>
      <div className="flex gap-2">
        {['بله', 'خیر', 'نامشخص'].map(opt => (
          <button key={opt} type="button" onClick={() => onChange('prev_repair', opt)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
              data.prev_repair === opt
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  </div>
)

// ─── تاریخچه (عیب‌یابی) ──────────────────────────────────────
export const HistoryStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">اقدامات انجام‌شده تاکنون</label>
      <textarea
        value={data.actions_taken || ''}
        onChange={e => onChange('actions_taken', e.target.value)}
        placeholder="مثال: تعویض روغن، بررسی اتصالات، ریست PLC..."
        rows={3}
        className={`${cls} resize-none`}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">شرایط کارکرد دستگاه</label>
      <input
        type="text"
        value={data.operating_conditions || ''}
        onChange={e => onChange('operating_conditions', e.target.value)}
        placeholder="مثال: ۱۶ ساعت/روز، بار ۸۰٪، دمای محیط ۴۵°"
        className={cls}
      />
    </div>
  </div>
)

// ─── جزئیات برق ──────────────────────────────────────────────
export const ElectricalDetailStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        نوع کار برق‌کاری <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select value={data.electrical_type || ''} onChange={e => onChange('electrical_type', e.target.value)} className={sels}>
          <option value="">انتخاب کنید...</option>
          {ELECTRICAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">ولتاژ سیستم</label>
        <div className="relative">
          <select value={data.voltage || ''} onChange={e => onChange('voltage', e.target.value)} className={sels}>
            <option value="">ولتاژ...</option>
            {['۲۲۰V تکفاز', '۳۸۰V سه‌فاز', '۲۴VDC', '۱۱۰VAC', 'فشار متوسط (۶/۱۱kV)', 'سایر'].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">توان (kW / A)</label>
        <input type="text" value={data.power_rating || ''} onChange={e => onChange('power_rating', e.target.value)} placeholder="مثال: ۱۵kW" className={cls} />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">توضیحات کار</label>
      <textarea
        value={data.electrical_description || ''}
        onChange={e => onChange('electrical_description', e.target.value)}
        placeholder="جزئیات مشکل یا کار مورد نیاز..."
        rows={3}
        className={`${cls} resize-none`}
      />
    </div>
  </div>
)

// ─── اطلاعات قطعه ────────────────────────────────────────────
export const PartInfoStep = ({ data, onChange, serviceType }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        نام / توضیح قطعه <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={data.part_name || ''}
        onChange={e => onChange('part_name', e.target.value)}
        placeholder={serviceType === 'supply'
          ? 'مثال: بلبرینگ SKF 6205، شیر برقی DN50...'
          : 'مثال: شفت، بوش، پولی، فلنج، اوربیتال...'}
        className={cls}
      />
    </div>
    {serviceType === 'supply' && (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">کد فنی / Part Number</label>
        <input type="text" value={data.part_number || ''} onChange={e => onChange('part_number', e.target.value)} placeholder="مثال: SKF-6205-2RS" className={cls} />
      </div>
    )}
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">سازنده / برند دستگاه اصلی</label>
      <input type="text" value={data.machine_brand || ''} onChange={e => onChange('machine_brand', e.target.value)} placeholder="مثال: Krones، Siemens، ABB..." className={cls} />
    </div>
  </div>
)

// ─── متریال (ساخت) ───────────────────────────────────────────
export const MaterialStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">جنس قطعه</label>
      <div className="relative">
        <select value={data.material || ''} onChange={e => onChange('material', e.target.value)} className={sels}>
          <option value="">انتخاب کنید...</option>
          {MATERIAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">فرایند ساخت (می‌توانید چند مورد انتخاب کنید)</label>
      <div className="grid grid-cols-2 gap-2">
        {MANUFACTURE_PROCESSES.map(p => {
          const active = (data.processes || []).includes(p)
          return (
            <button key={p} type="button"
              onClick={() => {
                const curr = data.processes || []
                onChange('processes', active ? curr.filter(x => x !== p) : [...curr, p])
              }}
              className={`py-2 px-3 rounded-lg border text-xs text-right transition ${
                active ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'
              }`}>
              {p}
            </button>
          )
        })}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">تلرانس / دقت مورد نیاز</label>
      <div className="relative">
        <select value={data.tolerance || ''} onChange={e => onChange('tolerance', e.target.value)} className={sels}>
          <option value="">انتخاب کنید...</option>
          {['خیلی دقیق (±0.01mm)', 'دقیق (±0.05mm)', 'معمولی (±0.1mm)', 'خشن (±0.5mm)'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
    </div>
  </div>
)

// ─── مشخصات تامین ────────────────────────────────────────────
export const SpecsStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">وضعیت اصالت قطعه</label>
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: 'original',   l: 'اصل (OEM)' },
          { v: 'compatible', l: 'همتراز' },
          { v: 'any',        l: 'هر دو' },
        ].map(opt => (
          <button key={opt.v} type="button" onClick={() => onChange('part_quality', opt.v)}
            className={`py-2.5 rounded-xl border-2 text-sm font-medium transition ${
              data.part_quality === opt.v
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            {opt.l}
          </button>
        ))}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">کشور سازنده (ترجیحی)</label>
      <input type="text" value={data.country_of_origin || ''} onChange={e => onChange('country_of_origin', e.target.value)} placeholder="مثال: آلمان، ژاپن، ایران، هر کشور" className={cls} />
    </div>
  </div>
)

// ─── تعداد ───────────────────────────────────────────────────
export const QuantityStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">تعداد <span className="text-red-500">*</span></label>
        <input type="number" min="1" value={data.quantity || ''} onChange={e => onChange('quantity', e.target.value)} placeholder="مثال: ۲" className={cls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">واحد</label>
        <div className="relative">
          <select value={data.unit || 'عدد'} onChange={e => onChange('unit', e.target.value)} className={sels}>
            {['عدد', 'کیلوگرم', 'متر', 'متر مربع', 'لیتر', 'دست', 'جفت'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">مهلت تحویل</label>
      <input type="date" value={data.delivery_deadline || ''} onChange={e => onChange('delivery_deadline', e.target.value)} min={new Date().toISOString().split('T')[0]} className={cls} />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">توضیحات اضافه</label>
      <textarea value={data.extra_notes || ''} onChange={e => onChange('extra_notes', e.target.value)} placeholder="هر اطلاعاتی که می‌تواند کمک کند..." rows={2} className={`${cls} resize-none`} />
    </div>
  </div>
)

// ─── فوریت ───────────────────────────────────────────────────
export const UrgencyStep = ({ urgency, onUrgencyChange, desiredDate, onDateChange }) => {
  const colorCls = {
    green:  'border-green-400 bg-green-50 text-green-700',
    yellow: 'border-yellow-400 bg-yellow-50 text-yellow-700',
    orange: 'border-orange-400 bg-orange-50 text-orange-700',
    red:    'border-red-400 bg-red-50 text-red-700',
  }
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">میزان فوریت</label>
        <div className="grid grid-cols-2 gap-2">
          {URGENCY_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => onUrgencyChange(opt.value)}
              className={`p-3 rounded-xl border-2 text-center transition ${
                urgency === opt.value ? colorCls[opt.color] : 'border-slate-200 hover:border-slate-300'
              }`}>
              <p className="font-bold text-sm">{opt.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ شروع مطلوب (اختیاری)</label>
        <input type="date" value={desiredDate} onChange={e => onDateChange(e.target.value)} min={new Date().toISOString().split('T')[0]} className={cls} />
      </div>
    </div>
  )
}

// ─── موقعیت (نصب) ────────────────────────────────────────────
export const LocationStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        آدرس / موقعیت نصب <span className="text-red-500">*</span>
      </label>
      <textarea value={data.install_location || ''} onChange={e => onChange('install_location', e.target.value)} placeholder="آدرس کامل محل نصب..." rows={2} className={`${cls} resize-none`} />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">نوع محیط</label>
      <div className="relative">
        <select value={data.environment_type || ''} onChange={e => onChange('environment_type', e.target.value)} className={sels}>
          <option value="">انتخاب کنید...</option>
          {['داخل سالن', 'فضای باز', 'اتاق کنترل', 'محیط خطرناک (Ex)', 'کلین‌روم', 'سردخانه'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
    </div>
  </div>
)

// ─── آپلود رسانه ─────────────────────────────────────────────
export const MediaStep = ({ attachments, previewUrls, onFilesAdd, onRemove }) => {
  const fileRef   = useRef(null)
  const cameraRef = useRef(null)
  const handleChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onFilesAdd(files)
    e.target.value = ''
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">تصاویر، نقشه یا فایل‌های فنی (اختیاری — تا ۵ فایل)</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => cameraRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition text-sm">
          <Camera size={20} /> <span>دوربین</span>
        </button>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition text-sm">
          <Image size={20} /> <span>فایل / گالری</span>
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} className="hidden" />
      <input ref={fileRef}   type="file" accept="image/*,.pdf,.doc,.docx,.dwg" onChange={handleChange} className="hidden" multiple />

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
              {attachments[i]?.type?.startsWith('image')
                ? <img src={url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center px-1 p-2">{attachments[i]?.name}</div>
              }
              <button type="button" onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <X size={12} />
              </button>
            </div>
          ))}
          {attachments.length < 5 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-blue-400 transition">
              <Plus size={18} className="text-slate-400" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
