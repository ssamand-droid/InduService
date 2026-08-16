// src/features/dashboard/seller/ProductForm.jsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { FiSave, FiX, FiUpload, FiTrash2, FiCamera } from 'react-icons/fi'
import { useProduct, useCreateProduct, useUpdateProduct, useCategories, useBrands } from '@features/products/hooks/useProducts'
import { Button, Card, Spinner, Alert } from '@components/ui'
import { FormInput, FormTextarea, FormSelect } from '@components/forms'
import { PRODUCT_TYPES, PRODUCT_CONDITIONS } from '@lib/constants'
import api from '@lib/axios'
import toast from 'react-hot-toast'

const productSchema = z.object({
  name: z.string().min(3, 'نام محصول حداقل ۳ کاراکتر'),
  sku: z.string().min(3, 'کد انبار الزامی است'),
  category: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  brand: z.string().optional(),
  product_type: z.enum(['part', 'kit', 'raw', 'tool']),
  condition: z.enum(['new', 'refurbished', 'used']),
  description: z.string().min(10, 'توضیحات حداقل ۱۰ کاراکتر'),
  short_description: z.string().max(300).optional(),
  price: z.coerce.number().min(0, 'قیمت نمی‌تواند منفی باشد'),
  discount_price: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().min(0, 'موجودی نمی‌تواند منفی باشد'),
  min_order_quantity: z.coerce.number().min(1, 'حداقل سفارش ۱ است').default(1),
  lead_time_days: z.coerce.number().min(1, 'زمان تامین حداقل ۱ روز').default(1),
  is_active: z.boolean().default(true),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
})

export default function ProductForm() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!slug
  const fileInputRef = useRef(null)

  const { data: existingProduct, isLoading: loadingProduct } = useProduct(slug, { enabled: isEditMode })
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const categories = categoriesData?.results || []
  const brands = brandsData?.results || []

  // State برای مدیریت عکس‌ها
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [deletedImageIds, setDeletedImageIds] = useState([])
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_type: 'part',
      condition: 'new',
      min_order_quantity: 1,
      lead_time_days: 1,
      is_active: true,
    },
  })

  useEffect(() => {
    if (existingProduct) {
      reset({
        name: existingProduct.name,
        sku: existingProduct.sku,
        category: existingProduct.category?.id?.toString() || '',
        brand: existingProduct.brand?.id?.toString() || '',
        product_type: existingProduct.product_type,
        condition: existingProduct.condition,
        description: existingProduct.description,
        short_description: existingProduct.short_description || '',
        price: existingProduct.price,
        discount_price: existingProduct.discount_price || '',
        stock_quantity: existingProduct.stock_quantity,
        min_order_quantity: existingProduct.min_order_quantity,
        lead_time_days: existingProduct.lead_time_days,
        is_active: existingProduct.is_active,
        meta_title: existingProduct.meta_title || '',
        meta_description: existingProduct.meta_description || '',
        meta_keywords: existingProduct.meta_keywords || '',
      })
      setExistingImages(existingProduct.images || [])
    }
  }, [existingProduct, reset])

  const handleNewImageSelect = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
  }

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageId) => {
    setDeletedImageIds(prev => [...prev, imageId])
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  const uploadNewImages = async (productSlug) => {
    if (newImages.length === 0) return
    setUploading(true)
    for (const file of newImages) {
      const formData = new FormData()
      formData.append('image', file)
      try {
        await api.post(`/api/products/products/${productSlug}/upload_image/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
    setUploading(false)
  }

  const deleteMarkedImages = async (productSlug) => {
    for (const imageId of deletedImageIds) {
      try {
        await api.delete(`/api/products/products/${productSlug}/images/${imageId}/`)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      category: parseInt(data.category),
      brand: data.brand ? parseInt(data.brand) : null,
    }

    if (isEditMode) {
      updateProduct.mutate(
        { slug, data: payload },
        {
          onSuccess: async (response) => {
            // آپلود عکس‌های جدید
            await uploadNewImages(slug)
            // حذف عکس‌های marked
            await deleteMarkedImages(slug)
            toast.success('محصول بروزرسانی شد')
            navigate('/dashboard/products')
          },
          onError: (error) => {
            console.error('Update error:', error)
            toast.error(error.userMessage || 'خطا در بروزرسانی')
          },
        }
      )
    } else {
      createProduct.mutate(payload, {
        onSuccess: async (response) => {
          if (newImages.length > 0) {
            await uploadNewImages(response.slug)
          }
          toast.success('محصول ایجاد شد')
          navigate('/dashboard/products')
        },
      })
    }
  }

  if (isEditMode && loadingProduct) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  const error = createProduct.error || updateProduct.error

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-3">{isEditMode ? 'ویرایش محصول' : 'محصول جدید'}</h2>
          <Button variant="ghost" onClick={() => navigate('/dashboard/products')}>
            <FiX className="ml-1" /> انصراف
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error.userMessage || 'خطا در ذخیره محصول'}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ======================== */}
          {/* Images Section */}
          {/* ======================== */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FiCamera className="text-primary-600" /> تصاویر محصول
            </h3>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={img.image} alt="" className="h-24 w-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <FiTrash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Images Preview */}
            {newImages.length > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-3">
                {newImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img src={URL.createObjectURL(file)} alt="" className="h-24 w-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <FiTrash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div
              className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleNewImageSelect}
              />
              <FiUpload className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
              <p className="text-sm text-secondary-500">کلیک کنید یا تصاویر را اینجا رها کنید</p>
            </div>
          </div>

          {/* ======================== */}
          {/* Basic Info */}
          {/* ======================== */}
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput label="نام محصول" name="name" register={register} error={errors.name} />
            <FormInput label="کد انبار (SKU)" name="sku" register={register} error={errors.sku} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormSelect label="دسته‌بندی" name="category" register={register} error={errors.category}
              options={categories.map(c => ({ value: c.id.toString(), label: c.name }))} placeholder="انتخاب دسته‌بندی" />
            <FormSelect label="برند (اختیاری)" name="brand" register={register} error={errors.brand}
              options={brands.map(b => ({ value: b.id.toString(), label: b.name }))} placeholder="انتخاب برند" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FormSelect label="نوع محصول" name="product_type" register={register} error={errors.product_type}
              options={Object.entries(PRODUCT_TYPES).map(([k, v]) => ({
                value: v, label: k === 'PART' ? 'قطعه' : k === 'KIT' ? 'کیت' : k === 'RAW' ? 'مواد اولیه' : 'ابزار',
              }))} />
            <FormSelect label="وضعیت" name="condition" register={register} error={errors.condition}
              options={Object.entries(PRODUCT_CONDITIONS).map(([k, v]) => ({
                value: v, label: v === 'new' ? 'نو' : v === 'refurbished' ? 'بازسازی شده' : 'کارکرده',
              }))} />
            <FormInput label="موجودی" name="stock_quantity" type="number" register={register} error={errors.stock_quantity} />
          </div>

          <FormTextarea label="توضیح کوتاه" name="short_description" register={register} error={errors.short_description} rows={2} />
          <FormTextarea label="توضیحات کامل" name="description" register={register} error={errors.description} rows={5} />

          <div className="grid md:grid-cols-2 gap-4">
            <FormInput label="قیمت (ریال)" name="price" type="number" register={register} error={errors.price} />
            <FormInput label="قیمت تخفیف‌خورده (اختیاری)" name="discount_price" type="number" register={register} error={errors.discount_price} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FormInput label="حداقل سفارش" name="min_order_quantity" type="number" register={register} />
            <FormInput label="زمان تامین (روز)" name="lead_time_days" type="number" register={register} />
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('is_active')} className="rounded border-secondary-300 text-primary-600" />
                <span className="text-sm font-medium">محصول فعال باشد</span>
              </label>
            </div>
          </div>

          {/* ======================== */}
          {/* SEO Section */}
          {/* ======================== */}
          <details className="border rounded-lg p-3">
            <summary className="cursor-pointer font-medium text-sm text-secondary-600">
              تنظیمات SEO (اختیاری)
            </summary>
            <div className="space-y-3 mt-3">
              <FormInput label="عنوان SEO (Meta Title)" name="meta_title" register={register}
                placeholder="اگر خالی باشد، نام محصول استفاده می‌شود" />
              <FormTextarea label="توضیحات متا (Meta Description)" name="meta_description" register={register}
                rows={2} placeholder="حداکثر ۳۰۰ کاراکتر" />
              <FormInput label="کلمات کلیدی (با کاما جدا کنید)" name="meta_keywords" register={register}
                placeholder="الکتروموتور، صنعتی، زیمنس" />
            </div>
          </details>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/products')}>انصراف</Button>
            <Button type="submit" variant="primary"
              isLoading={isSubmitting || createProduct.isPending || updateProduct.isPending || uploading}
              loadingText="در حال ذخیره...">
              <FiSave className="ml-2" />
              {isEditMode ? 'بروزرسانی محصول' : 'ایجاد محصول'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}