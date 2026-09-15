import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { FiUpload, FiX, FiFile } from 'react-icons/fi'
import { useService, useCreateServiceRequest } from '../hooks/useServices'
import { Button, Alert } from '@components/ui'
import { FormInput, FormTextarea, FormSelect } from '@components/forms'
import { WorkflowPreview } from './WorkflowPreview'

const baseSchema = z.object({
  service: z.number(),
  title: z.string().min(1, 'عنوان درخواست الزامی است'),
  description: z.string().min(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد'),
  equipment_details: z.string().optional(),
  desired_start_date: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
})

const urgencyOptions = [
  { value: 'low', label: 'کم' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'زیاد' },
  { value: 'critical', label: 'بحرانی' },
]

const getScenarioSchema = (scenario) => {
  const extraSchemas = {
    rewinding: z.object({ motor_power: z.coerce.number().optional(), voltage: z.coerce.number().optional(), pole_count: z.coerce.number().optional() }),
    machining: z.object({ has_drawing: z.boolean().default(false), material_type: z.string().optional(), quantity: z.coerce.number().min(1).default(1) }),
    oil_analysis: z.object({ oil_type: z.string().min(1, 'نوع روغن را مشخص کنید'), component_location: z.string().min(1, 'محل نمونه‌گیری را مشخص کنید') }),
    calibration: z.object({ equipment_type: z.string().optional(), range: z.string().optional(), certificate_required: z.boolean().default(true) }),
    ndt: z.object({ test_method: z.enum(['UT', 'RT', 'MT', 'PT', 'VT']).default('UT'), material: z.string().optional() }),
  }
  return extraSchemas[scenario] || z.object({})
}

export const ServiceRequestForm = ({ serviceId, serviceTitle, onSuccess }) => {
  const navigate = useNavigate()
  const { data: service } = useService(serviceId)
  const { mutate: createRequest, isPending, error } = useCreateServiceRequest()

  const [files, setFiles] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdRequestId, setCreatedRequestId] = useState(null)

  const scenario = service?.service_scenario
  const extraSchema = getScenarioSchema(scenario)
  const formSchema = baseSchema.merge(extraSchema)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: serviceId,
      title: `درخواست ${serviceTitle || ''}`,
      urgency: 'medium',
      has_drawing: false,
      test_method: 'UT',
    },
  })

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    const { service, title, description, equipment_details, desired_start_date, urgency, ...extraData } = data

    const payload = {
      service,
      title,
      description,
      equipment_details,
      desired_start_date,
      urgency,
      extra_data: extraData,
    }

    createRequest(payload, {
      onSuccess: (response) => {
        setCreatedRequestId(response.id)
        setShowSuccess(true)
        onSuccess?.()
      },
    })
  }

  if (showSuccess) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-bold mb-2">درخواست شما با موفقیت ثبت شد</h3>
        <p className="text-secondary-600 mb-6">شماره درخواست: {createdRequestId}</p>
        <div className="flex justify-center gap-3">
          <Button variant="primary" onClick={() => { setShowSuccess(false); navigate('/services') }}>
            ثبت درخواست جدید
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/service-requests')}>
            مشاهده درخواست‌های من
          </Button>
        </div>
      </div>
    )
  }

  const renderExtraFields = () => {
    if (scenario === 'rewinding') {
      return (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
          <h4 className="font-medium text-blue-800 dark:text-blue-300">⚡ اطلاعات الکتروموتور</h4>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="توان (kW)" name="motor_power" type="number" register={register} />
            <FormInput label="ولتاژ (V)" name="voltage" type="number" register={register} />
            <FormInput label="تعداد قطب" name="pole_count" type="number" register={register} />
          </div>
        </div>
      )
    }
    if (scenario === 'machining') {
      return (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-3">
          <h4 className="font-medium text-amber-800">🔧 اطلاعات ساخت قطعه</h4>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('has_drawing')} className="rounded" />
            <span className="text-sm">نقشه فنی دارم</span>
          </label>
          <FormInput label="نوع ماده" name="material_type" register={register} placeholder="مثلاً CK45" />
          <FormInput label="تعداد" name="quantity" type="number" register={register} />
        </div>
      )
    }
    if (scenario === 'oil_analysis') {
      return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
          <h4 className="font-medium text-green-800">🧪 اطلاعات نمونه‌گیری</h4>
          <FormInput label="نوع روغن" name="oil_type" register={register} />
          <FormInput label="محل نمونه‌گیری" name="component_location" register={register} />
        </div>
      )
    }
    return null
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register('service')} />

      <FormInput label="عنوان درخواست" name="title" register={register} error={errors.title}
        placeholder="مثلاً: تعمیر الکتروموتور ۵۰ اسب" />

      <FormTextarea label="شرح مشکل یا نیاز" name="description" register={register} error={errors.description}
        placeholder="لطفاً مشکل یا خدمت مورد نیاز را با جزئیات توضیح دهید..." rows={4} />

      <FormTextarea label="مشخصات تجهیز (اختیاری)" name="equipment_details" register={register}
        placeholder="برند، مدل، سال ساخت..." rows={2} />

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="تاریخ شروع مطلوب" name="desired_start_date" type="date" register={register} />
        <FormSelect label="فوریت" name="urgency" register={register} error={errors.urgency} options={urgencyOptions} />
      </div>

      {renderExtraFields()}

      {/* بخش آپلود فایل */}
      <div>
        <label className="block text-sm font-medium mb-2">📎 تصاویر و فایل‌های ضمیمه (حداکثر ۵ فایل)</label>
        <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-4 text-center hover:border-primary-500 transition cursor-pointer"
          onClick={() => document.getElementById('file-upload').click()}>
          <input id="file-upload" type="file" multiple className="hidden"
            accept="image/*,.pdf,.doc,.docx,.zip" onChange={handleFileChange} />
          <FiUpload className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
          <p className="text-sm text-secondary-500">کلیک کنید یا فایل‌ها را اینجا رها کنید</p>
        </div>
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-secondary-50 dark:bg-secondary-800 p-2 rounded text-sm">
                <span className="flex items-center gap-2">
                  <FiFile className="h-4 w-4 text-primary-500" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {scenario && (
        <div className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <h4 className="font-medium mb-2">📋 مراحل پیش‌بینی شده:</h4>
          <WorkflowPreview scenario={scenario} />
        </div>
      )}

      {error && <Alert variant="error">{error.response?.data?.error?.message || 'خطا در ثبت درخواست'}</Alert>}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" variant="primary" isLoading={isPending} loadingText="در حال ثبت...">
          ثبت درخواست
        </Button>
      </div>
    </form>
  )
}