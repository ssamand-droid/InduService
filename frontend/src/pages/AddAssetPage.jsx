import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera, Upload, X, CheckCircle, AlertCircle,
  Info, ChevronRight
} from 'lucide-react'
import assetService from '@services/assetService'
import { Spinner } from '@components/ui'

const CRITICALITY_OPTIONS = [
  { value: 'low', label: 'پایین - بدون تأثیر فوری' },
  { value: 'medium', label: 'متوسط - تأثیر غیرمستقیم' },
  { value: 'high', label: 'بالا - تأثیر مستقیم بر تولید' },
  { value: 'critical', label: 'بحرانی - توقف کامل خط تولید' },
]

const AddAssetPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    tag_number: '',
    brand: '',
    model_number: '',
    serial_number: '',
    location: '',
    production_line: '',
    criticality: 'medium',
    category: '',
    installation_date: '',
    purchase_price: '',
    hourly_downtime_cost: '',
    notes: '',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await assetService.getCategories()
      setCategories(Array.isArray(res.data) ? res.data : res.data?.results || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // پاک کردن خطای فیلد
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, main_image: file }))
      const reader = new FileReader()
      reader.onloadend = () => setPreviewImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'نام دستگاه الزامی است'
    }
    if (!formData.tag_number.trim()) {
      newErrors.tag_number = 'شماره پلاک الزامی است'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) return

    setLoading(true)

    try {
      const submitData = new FormData()

      // اضافه کردن فیلدهای متنی
      Object.keys(formData).forEach(key => {
        if (key === 'main_image') {
          // فقط اگر فایل انتخاب شده باشد
          if (formData.main_image instanceof File) {
            submitData.append('main_image', formData.main_image)
          }
        } else if (formData[key] && formData[key] !== '') {
          submitData.append(key, formData[key])
        }
      })

      // لاگ برای دیباگ
      console.log('📤 Sending FormData:')
      for (let pair of submitData.entries()) {
        console.log(`  ${pair[0]}:`, pair[1])
      }

      const response = await assetService.createAsset(submitData)

      setSuccess(true)
      setTimeout(() => {
        navigate(`/dashboard/assets/${response.data.id}`)
      }, 1500)

    } catch (error) {
      console.error('Create asset error:', error)

      if (error.response?.data) {
        const data = error.response.data

        // خطاهای فیلدها
        if (typeof data === 'object') {
          const fieldErrors = {}
          Object.keys(data).forEach(key => {
            fieldErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key]
          })
          setErrors(fieldErrors)
        }

        // خطای محدودیت اشتراک
        if (data?.upgrade_required) {
          setApiError({
            title: 'محدودیت سهمیه رایگان دستگاه',
            message: data.message,
            action: 'ارتقاء اشتراک'
          })
        } else {
          setApiError({
            title: 'خطا در ثبت',
            message: data?.error?.message || data?.detail || 'مشکلی پیش آمده است',
          })
        }
      } else {
        setApiError({
          title: 'خطا',
          message: error.userMessage || 'خطای ارتباط با سرور',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // وضعیت موفقیت
  {success && (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center animate-bounce-in">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-green-700 mb-2">دستگاه با موفقیت ثبت شد!</h2>
      </div>
    </div>
  )}

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* هدر */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ثبت دستگاه جدید</h1>
        <p className="text-gray-500 mt-1">اطلاعات دستگاه را وارد کنید</p>
      </div>

      {/* خطای محدودیت اشتراک */}
      {apiError?.action === 'ارتقاء اشتراک' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-yellow-800">{apiError.title}</h3>
              <p className="text-sm text-yellow-700 mt-1">{apiError.message}</p>
              <button className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition">
                ارتقاء به حساب حرفه‌ای
              </button>
            </div>
          </div>
        </div>
      )}

      {/* خطای عمومی */}
      {apiError && apiError.action !== 'ارتقاء اشتراک' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-red-700">{apiError.title}</h3>
            <p className="text-sm text-red-600 mt-1">{apiError.message}</p>
          </div>
        </div>
      )}

      {/* فرم */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {/* بخش اطلاعات پایه */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info size={20} className="text-indigo-500" />
            اطلاعات پایه
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* نام دستگاه */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                نام دستگاه <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="مثال: پمپ سیرکولاسیون خط A"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* شماره پلاک */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                شماره پلاک <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tag_number"
                value={formData.tag_number}
                onChange={handleChange}
                placeholder="مثال: PMP-001"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition ${
                  errors.tag_number
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
              {errors.tag_number && (
                <p className="text-red-500 text-xs mt-1">{errors.tag_number}</p>
              )}
            </div>

            {/* دسته‌بندی */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                دسته‌بندی
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">انتخاب کنید...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* برند */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">برند</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="مثال: KSB"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* شماره مدل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">شماره مدل</label>
              <input
                type="text"
                name="model_number"
                value={formData.model_number}
                onChange={handleChange}
                placeholder="مثال: Etanorm 100-250"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* شماره سریال */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">شماره سریال</label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                placeholder="مثال: SN123456"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* موقعیت */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">موقعیت نصب</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="مثال: موتورخانه مرکزی"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* خط تولید */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">خط تولید</label>
              <input
                type="text"
                name="production_line"
                value={formData.production_line}
                onChange={handleChange}
                placeholder="مثال: خط A"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* درجه بحرانی */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">درجه بحرانی</label>
              <select
                name="criticality"
                value={formData.criticality}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CRITICALITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* تاریخ نصب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">تاریخ نصب</label>
              <input
                type="date"
                name="installation_date"
                value={formData.installation_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* بخش مالی */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">اطلاعات مالی</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                قیمت خرید (ریال)
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                placeholder="مثال: ۱۵۰۰۰۰۰۰۰۰"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                هزینه هر ساعت توقف (ریال)
              </label>
              <input
                type="number"
                name="hourly_downtime_cost"
                value={formData.hourly_downtime_cost}
                onChange={handleChange}
                placeholder="مثال: ۵۰۰۰۰۰۰۰"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* بخش تصویر */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">تصویر دستگاه</h2>
          <div className="flex items-start gap-6">
            {/* پیش‌نمایش */}
            <div className="flex-shrink-0">
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="پیش‌نمایش"
                    className="w-32 h-32 object-cover rounded-xl border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null)
                      setFormData(prev => ({ ...prev, main_image: null }))
                    }}
                    className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Camera className="text-gray-400" size={32} />
                </div>
              )}
            </div>

            {/* دکمه آپلود */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition"
              >
                <Upload size={20} />
                آپلود تصویر
              </button>
              <p className="text-xs text-gray-400 mt-2">
                فرمت‌های مجاز: JPG, PNG, WebP
              </p>
            </div>
          </div>
        </div>

        {/* یادداشت */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            یادداشت‌های فنی
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="توضیحات تکمیلی درباره دستگاه..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* دکمه‌های عملیات */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                در حال ثبت...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                ثبت دستگاه
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddAssetPage
