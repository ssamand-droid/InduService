import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { FiSave, FiX, FiUpload, FiImage, FiTrash2 } from 'react-icons/fi'
import { useService, useServiceCategories } from '@features/services/hooks/useServices'
import { Button, Card, Alert } from '@components/ui'
import { FormInput, FormTextarea, FormSelect } from '@components/forms'
import { SERVICE_TYPES, SERVICE_SCENARIOS } from '@lib/constants'
import api from '@lib/axios'
import toast from 'react-hot-toast'

const serviceSchema = z.object({
  title: z.string().min(3, 'عنوان خدمت حداقل ۳ کاراکتر'),
  category: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  service_type: z.enum(['repair', 'maintenance', 'overhaul', 'inspection', 'installation', 'consulting']),
  service_scenario: z.string().min(1, 'سناریوی خدمت را انتخاب کنید'),
  pricing_model: z.enum(['fixed', 'hourly', 'quotation', 'per_project']),
  base_price: z.coerce.number().optional(),
  hourly_rate: z.coerce.number().optional(),
  description: z.string().min(10, 'توضیحات حداقل ۱۰ کاراکتر'),
  requirements: z.string().optional(),
  estimated_duration_days: z.coerce.number().min(1).default(1),
  warranty_months: z.coerce.number().min(0).default(0),
  service_area: z.string().optional(),
  is_remote: z.boolean().default(false),
  is_onsite: z.boolean().default(true),
  is_active: z.boolean().default(true),
})

export default function ServiceForm() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!slug

  const { data: existingService, isLoading: loadingService } = useService(slug, { enabled: isEditMode })
  const { data: categoriesData, isLoading: loadingCategories } = useServiceCategories()
  
  // State for images
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState(null)

  const categories = categoriesData?.results || categoriesData || []

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_type: 'repair',
      service_scenario: 'emergency_repair',
      pricing_model: 'quotation',
      estimated_duration_days: 1,
      warranty_months: 0,
      is_remote: false,
      is_onsite: true,
      is_active: true,
    },
  })

  const pricingModel = watch('pricing_model')

  // Load existing service data
  useEffect(() => {
    if (existingService) {
      reset({
        title: existingService.title,
        category: existingService.category?.id?.toString() || '',
        service_type: existingService.service_type,
        service_scenario: existingService.service_scenario,
        pricing_model: existingService.pricing_model,
        base_price: existingService.base_price || '',
        hourly_rate: existingService.hourly_rate || '',
        description: existingService.description,
        requirements: existingService.requirements || '',
        estimated_duration_days: existingService.estimated_duration_days,
        warranty_months: existingService.warranty_months,
        service_area: existingService.service_area || '',
        is_remote: existingService.is_remote,
        is_onsite: existingService.is_onsite,
        is_active: existingService.is_active,
      })
      
      // Load existing images
      if (existingService.images && existingService.images.length > 0) {
        setExistingImages(existingService.images)
      }
    }
  }, [existingService, reset])

  // Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const validImages = files.filter(file => file.type.startsWith('image/'))
    
    if (validImages.length === 0) {
      toast.error('لطفاً فقط فایل تصویری انتخاب کنید')
      return
    }
    
    const totalImages = existingImages.length + images.length + validImages.length
    if (totalImages > 10) {
      toast.error('حداکثر ۱۰ تصویر می‌توانید آپلود کنید')
      return
    }
    
    setImages(prev => [...prev, ...validImages])
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId) => {
    if (!window.confirm('آیا از حذف این تصویر اطمینان دارید؟')) return
    
    setDeletingImageId(imageId)
    try {
      // ارسال درخواست حذف به سرور
      await api.delete(`/api/services/service-images/${imageId}/`)
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('تصویر حذف شد')
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error(error.response?.data?.message || 'خطا در حذف تصویر')
    } finally {
      setDeletingImageId(null)
    }
  }

  const onSubmit = async (data) => {
    if (images.length === 0 && existingImages.length === 0) {
      toast.error('حداقل یک تصویر برای خدمت آپلود کنید')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      
      // اضافه کردن فیلدهای متنی
      formData.append('title', data.title)
      formData.append('category', parseInt(data.category))
      formData.append('service_type', data.service_type)
      formData.append('service_scenario', data.service_scenario)
      formData.append('pricing_model', data.pricing_model)
      formData.append('description', data.description)
      
      if (data.base_price) formData.append('base_price', data.base_price)
      if (data.hourly_rate) formData.append('hourly_rate', data.hourly_rate)
      if (data.requirements) formData.append('requirements', data.requirements)
      if (data.estimated_duration_days) formData.append('estimated_duration_days', data.estimated_duration_days)
      if (data.warranty_months) formData.append('warranty_months', data.warranty_months)
      if (data.service_area) formData.append('service_area', data.service_area)
      
      formData.append('is_remote', data.is_remote)
      formData.append('is_onsite', data.is_onsite)
      formData.append('is_active', data.is_active)
      
      // اضافه کردن تصاویر جدید
      images.forEach((image) => {
        formData.append('images', image)
      })
      
      // ارسال به سرور
      let response
      if (isEditMode) {
        response = await api.patch(`/api/services/services/${slug}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        response = await api.post('/api/services/services/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      
      if (response.data) {
        toast.success(isEditMode ? 'خدمت با موفقیت بروزرسانی شد' : 'خدمت با موفقیت ایجاد شد')
        navigate('/dashboard/services')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || error.response?.data?.error?.message || 'خطا در ذخیره خدمت')
    } finally {
      setUploading(false)
    }
  }

  if (loadingService || loadingCategories) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Prepare category options
  const categoryOptions = categories.length > 0 
    ? categories.map(c => ({ value: c.id.toString(), label: c.name }))
    : [{ value: '', label: 'دسته‌بندی موجود نیست' }]

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
      <Card className="card-responsive">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">{isEditMode ? 'ویرایش خدمت' : 'ایجاد خدمت جدید'}</h2>
          <Button variant="ghost" onClick={() => navigate('/dashboard/services')} className="w-full sm:w-auto">
            <FiX className="ml-1" />
            انصراف
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* عنوان خدمت */}
          <FormInput
            label="عنوان خدمت *"
            name="title"
            register={register}
            error={errors.title}
            placeholder="مثلاً: تعمیر تخصصی الکتروموتور"
          />

          {/* دسته‌بندی و نوع خدمت */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">دسته‌بندی *</label>
              <select
                {...register('category')}
                className={`w-full rounded-lg border p-2.5 dark:bg-secondary-800 ${errors.category ? 'border-red-500' : 'border-secondary-300'}`}
                disabled={categories.length === 0}
              >
                <option value="">انتخاب دسته‌بندی</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
              {categories.length === 0 && !loadingCategories && (
                <p className="text-amber-500 text-xs mt-1">
                  ⚠️ دسته‌بندی موجود نیست. لطفاً ابتدا در پنل ادمین دسته‌بندی ایجاد کنید.
                </p>
              )}
            </div>

            <FormSelect
              label="نوع خدمت *"
              name="service_type"
              register={register}
              error={errors.service_type}
              options={Object.entries(SERVICE_TYPES).map(([k, v]) => ({
                value: v,
                label: k === 'REPAIR' ? 'تعمیر' : k === 'MAINTENANCE' ? 'نگهداری' : k === 'OVERHAUL' ? 'اورهال' : k === 'INSPECTION' ? 'بازرسی' : k === 'INSTALLATION' ? 'نصب' : 'مشاوره',
              }))}
            />
          </div>

          {/* سناریو و مدل قیمت */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="سناریوی خدمت *"
              name="service_scenario"
              register={register}
              error={errors.service_scenario}
              options={Object.entries(SERVICE_SCENARIOS).map(([value, label]) => ({ value, label }))}
            />
            <FormSelect
              label="مدل قیمت‌گذاری *"
              name="pricing_model"
              register={register}
              error={errors.pricing_model}
              options={[
                { value: 'fixed', label: 'قیمت ثابت' },
                { value: 'hourly', label: 'ساعتی' },
                { value: 'quotation', label: 'استعلام قیمت' },
                { value: 'per_project', label: 'پروژه‌ای' },
              ]}
            />
          </div>

          {/* قیمت بر اساس مدل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pricingModel === 'fixed' && (
              <FormInput
                label="قیمت پایه (ریال)"
                name="base_price"
                type="number"
                register={register}
                error={errors.base_price}
                placeholder="مثلاً 5000000"
              />
            )}
            {pricingModel === 'hourly' && (
              <FormInput
                label="نرخ ساعتی (ریال)"
                name="hourly_rate"
                type="number"
                register={register}
                error={errors.hourly_rate}
                placeholder="مثلاً 500000"
              />
            )}
            
            <FormInput
              label="مدت زمان تخمینی (روز)"
              name="estimated_duration_days"
              type="number"
              register={register}
              error={errors.estimated_duration_days}
            />
          </div>

          {/* توضیحات */}
          <FormTextarea
            label="توضیحات کامل *"
            name="description"
            register={register}
            error={errors.description}
            rows={5}
            placeholder="شرح کامل خدمت، تجهیزات، تخصص‌ها و ..."
          />

          <FormTextarea
            label="پیش‌نیازها و ملاحظات"
            name="requirements"
            register={register}
            error={errors.requirements}
            rows={3}
            placeholder="مدارک مورد نیاز، شرایط خاص، هشدارها و ..."
          />

          {/* سایر فیلدها */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="گارانتی (ماه)"
              name="warranty_months"
              type="number"
              register={register}
              error={errors.warranty_months}
            />
            <FormInput
              label="محدوده خدمات"
              name="service_area"
              register={register}
              error={errors.service_area}
              placeholder="مثلاً: تهران، کرج، سراسر کشور"
            />
          </div>

          {/* چک‌باکس‌ها */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_remote')} className="rounded" />
              <span className="text-sm">قابلیت انجام از راه دور</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_onsite')} className="rounded" />
              <span className="text-sm">حضور در محل مشتری</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="rounded" />
              <span className="text-sm">فعال (نمایش در سایت)</span>
            </label>
          </div>

          {/* ==================== بخش آپلود تصاویر ==================== */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FiImage className="text-primary-500" />
              تصاویر خدمت (حداکثر ۱۰ تصویر) <span className="text-red-500">*</span>
            </label>
            
            {/* تصاویر موجود (در حالت ویرایش) */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-secondary-500 mb-2">تصاویر فعلی:</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {existingImages.map((img, idx) => (
                    <div key={img.id || idx} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-secondary-200 dark:border-secondary-700 bg-secondary-50">
                        <img 
                          src={img.image} 
                          alt={img.alt_text || 'خدمت'} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          disabled={deletingImageId === img.id}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                        >
                          {deletingImageId === img.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <FiTrash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* آپلود تصاویر جدید */}
            <div 
              className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-6 text-center hover:border-primary-500 transition cursor-pointer bg-secondary-50 dark:bg-secondary-800/50"
              onClick={() => document.getElementById('image-upload')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const files = Array.from(e.dataTransfer.files)
                const validImages = files.filter(f => f.type.startsWith('image/'))
                const totalImages = existingImages.length + images.length + validImages.length
                if (totalImages > 10) {
                  toast.error('حداکثر ۱۰ تصویر می‌توانید آپلود کنید')
                  return
                }
                setImages(prev => [...prev, ...validImages])
              }}
            >
              <input 
                id="image-upload" 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
              />
              <FiUpload className="h-10 w-10 mx-auto text-secondary-400 mb-2" />
              <p className="text-sm text-secondary-500">کلیک کنید یا تصاویر را اینجا رها کنید</p>
              <p className="text-xs text-secondary-400 mt-1">فرمت‌های مجاز: JPG, PNG, GIF, WebP</p>
              <p className="text-xs text-secondary-400">حداکثر ۱۰ تصویر</p>
            </div>

            {/* پیش‌نمایش تصاویر جدید */}
            {images.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-secondary-500 mb-2">تصاویر جدید ({images.length}):</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-primary-300 bg-secondary-50">
                        <img 
                          src={URL.createObjectURL(img)} 
                          alt="پیش‌نمایش" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-secondary-500 mt-1 truncate">{img.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* هشدار برای عدم وجود تصویر */}
            {images.length === 0 && existingImages.length === 0 && (
              <p className="text-amber-500 text-xs mt-2 flex items-center gap-1">
                <span>⚠️</span> حداقل یک تصویر برای خدمت الزامی است
              </p>
            )}
          </div>

          {/* دکمه‌های submit */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/dashboard/services')}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || uploading}
              loadingText="در حال ذخیره..."
              className="w-full sm:w-auto"
            >
              <FiSave className="ml-2" />
              {isEditMode ? 'بروزرسانی خدمت' : 'ایجاد خدمت'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}