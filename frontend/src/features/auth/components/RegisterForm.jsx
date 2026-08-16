// src/features/auth/components/RegisterForm.jsx (بازنویسی کامل)

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiUser, FiPhone, FiLock, FiEye, FiEyeOff, FiBriefcase, FiHome, FiPlus, FiTrash2 } from 'react-icons/fi'
import { Button, Card, Spinner } from '@components/ui'
import { FormInput, FormSelect } from '@components/forms'
import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { BUYER_ROLES, PROVIDER_ROLES } from '@lib/constants'
import api from '@lib/axios'
import toast from 'react-hot-toast'

// ========================
// Schema - Step 1
// ========================
const step1Schema = z.object({
  phone_number: z.string().min(11).max(11),
  password: z.string().min(6),
  password_confirm: z.string().min(6),
}).refine((data) => data.password === data.password_confirm, {
  message: 'رمز عبور و تکرار آن یکسان نیستند',
  path: ['password_confirm'],
})

// ========================
// Schema - Step 2
// ========================
const step2Schema = z.object({
  first_name: z.string().min(1, 'نام الزامی است'),
  last_name: z.string().min(1, 'نام خانوادگی الزامی است'),
  person_type: z.enum(['individual', 'legal']),
  // حقیقی
  national_id: z.string().optional(),
  // دریافت‌کننده
  buyer_sub_role: z.string().optional(),
  // خدمات‌دهنده
  provider_sub_role: z.string().optional(),
  // حقوقی
  company_name: z.string().optional(),
})

// ========================
// Constants
// ========================
const providerSubRoles = [
  { value: 'engineer', label: 'مهندس مشاور' },
  { value: 'repairman', label: 'تعمیرکار' },
  { value: 'technician', label: 'تکنسین فنی' },
  { value: 'other', label: 'سایر' },
]

const contactRoles = [
  { value: 'مدیر کارخانه', label: 'مدیر کارخانه' },
  { value: 'مدیر فنی/نت', label: 'مدیر فنی / نت' },
  { value: 'مدیر بازرگانی', label: 'مدیر بازرگانی / تدارکات' },
  { value: 'تکنسین', label: 'تکنسین' },
  { value: 'اپراتور', label: 'اپراتور' },
  { value: 'سایر', label: 'سایر' },
]

// ========================
// Component
// ========================
export const RegisterForm = () => {
  const navigate = useNavigate()
  const { register: registerUser, isRegistering } = useAuth()

  // State
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [userId, setUserId] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [contacts, setContacts] = useState([])

  // Step 1 Form
  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { phone_number: '', password: '', password_confirm: '' },
  })

  // Step 2 Form
  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      first_name: '', last_name: '', person_type: 'individual',
      national_id: '', buyer_sub_role: '', provider_sub_role: '', company_name: '',
    },
  })

  const watchPersonType = step2Form.watch('person_type')
  const watchProviderSubRole = step2Form.watch('provider_sub_role')
  const isBuyerRole = BUYER_ROLES.includes(selectedRole)
  const isProviderRole = PROVIDER_ROLES.includes(selectedRole)

  // ========================
  // Handlers
  // ========================

  /** افزودن یک رابط جدید */
  const addContact = () => {
    setContacts(prev => [...prev, { name: '', role: 'مدیر کارخانه', phone: '' }])
  }

  /** حذف یک رابط */
  const removeContact = (index) => {
    setContacts(prev => prev.filter((_, i) => i !== index))
  }

  /** آپدیت یک فیلد رابط */
  const updateContact = (index, field, value) => {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  /** Step 1 Submit */
  const onStep1Submit = async (data) => {
    try {
      const response = await api.post('/api/users/register_step1/', {
        phone_number: data.phone_number,
        password: data.password,
        password_confirm: data.password_confirm,
        role: selectedRole,
      })
      if (response.data.success) {
        setUserId(response.data.user_id)
        toast.success('✅ مرحله اول با موفقیت انجام شد')
        setStep(2)
      }
    } catch (error) {
      const msg = error.response?.data?.error?.details
      const firstError = msg ? Object.values(msg)[0]?.[0] : 'خطا در ثبت‌نام'
      toast.error(firstError)
    }
  }

  /** Step 2 Submit */
  const onStep2Submit = async (data) => {
    try {
      const payload = {
        user_id: userId,
        ...data,
        company_contacts: contacts.length > 0 ? contacts : [],
      }
      const response = await api.post('/api/users/register_step2/', payload)
      if (response.data.success) {
        toast.success('🎉 ثبت‌نام با موفقیت تکمیل شد')
        navigate('/login')
      }
    } catch (error) {
      toast.error('خطا در تکمیل ثبت‌نام')
    }
  }

  // ========================
  // Render: Step 1 - انتخاب نقش
  // ========================
  if (step === 1) {
    return (
      <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6 animate-fade-in">
        {/* <h2 className="text-xl font-bold text-center" InduService</h2> */}

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '🏭', title: 'دریافت‌کننده خدمات', desc: 'درخواست خدمات / قطعه / تعمیرات دارم', role: 'buyer' },
            { icon: '🔧', title: 'خدمات‌دهنده', desc: 'خدمات / محصول ارائه میدهم', role: 'provider' },
          ].map((card) => (
            <Card
              key={card.role}
              hoverable
              className={`p-4 cursor-pointer border-2 transition ${
                selectedRole === card.role ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-secondary-200'
              }`}
              onClick={() => setSelectedRole(card.role)}
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <h3 className="font-bold">{card.title}</h3>
              <p className="text-sm text-secondary-500 mt-1">{card.desc}</p>
            </Card>
          ))}
        </div>

        {/* Person Type - فقط برای خدمات‌دهنده نمایش داده شود */}
        {selectedRole === 'provider' && (
          <div>
            <label className="block text-sm font-medium mb-2">نوع شخصیت:</label>
            <div className="flex gap-4">
              {[
                { value: 'individual', label: '👤 حقیقی', role: 'service_provider' },
                { value: 'legal', label: '🏢 حقوقی (شرکت)', role: 'company_provider' },
              ].map((opt) => (
                <label key={opt.value} className={`flex-1 p-3 text-center rounded-lg border-2 cursor-pointer transition ${
                  watchPersonType === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-secondary-200'
                }`}>
                  <input
                    type="radio"
                    value={opt.value}
                    {...step2Form.register('person_type')}
                    onChange={(e) => {
                      step2Form.setValue('person_type', e.target.value)
                      // Set actual role based on person_type
                      setSelectedRole(opt.role)
                    }}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* برای دریافت‌کننده: مستقیماً حقیقی/حقوقی */}
        {selectedRole === 'buyer' && (
          <div>
            <label className="block text-sm font-medium mb-2">نوع شخصیت:</label>
            <div className="flex gap-4">
              {[
                { value: 'individual', label: '👤 حقیقی' },
                { value: 'legal', label: '🏢 حقوقی (شرکت/کارخانه)' },
              ].map((opt) => (
                <label key={opt.value} className={`flex-1 p-3 text-center rounded-lg border-2 cursor-pointer transition ${
                  watchPersonType === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-secondary-200'
                }`}>
                  <input type="radio" value={opt.value} {...step2Form.register('person_type')} className="hidden" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <FormInput label="شماره موبایل *" name="phone_number" type="tel" register={step1Form.register}
          error={step1Form.formState.errors.phone_number} placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          icon={<FiPhone className="w-5 h-5" />} />

        <div className="relative">
          <FormInput label="رمز عبور *" name="password" type={showPassword ? 'text' : 'password'}
            register={step1Form.register} error={step1Form.formState.errors.password}
            placeholder="حداقل ۶ کاراکتر" icon={<FiLock className="w-5 h-5" />} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-9 text-secondary-500">
            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <FormInput label="تکرار رمز عبور *" name="password_confirm" type={showConfirmPassword ? 'text' : 'password'}
            register={step1Form.register} error={step1Form.formState.errors.password_confirm}
            placeholder="تکرار رمز عبور" icon={<FiLock className="w-5 h-5" />} />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute left-3 top-9 text-secondary-500">
            {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
          </button>
        </div>

        <Button type="submit" variant="primary" fullWidth isLoading={isRegistering}
          disabled={!selectedRole} loadingText="در حال ثبت...">
          مرحله بعد
        </Button>

        <div className="text-center text-sm">
          <Link to="/login" className="text-primary-600 hover:underline">قبلاً ثبت‌نام کرده‌اید؟ وارد شوید</Link>
        </div>
      </form>
    )
  }

  // ========================
  // Render: Step 2 - تکمیل اطلاعات
  // ========================
  return (
    <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">تکمیل اطلاعات</h2>
        <span className="text-sm text-secondary-500">
          {isBuyerRole ? '🏭 دریافت‌کننده' : '🔧 خدمات‌دهنده'}
        </span>
      </div>

      {/* Person Type */}
      <div className="flex gap-4">
        {[
          { value: 'individual', label: '👤 حقیقی' },
          { value: 'legal', label: '🏢 حقوقی (شرکت/کارخانه)' },
        ].map((opt) => (
          <label key={opt.value} className={`flex-1 p-3 text-center rounded-lg border-2 cursor-pointer transition ${
            watchPersonType === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-secondary-200'
          }`}>
            <input type="radio" value={opt.value} {...step2Form.register('person_type')} className="hidden" />
            <span className="text-sm font-medium">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="نام *" name="first_name" register={step2Form.register}
          error={step2Form.formState.errors.first_name} placeholder="نام" />
        <FormInput label="نام خانوادگی *" name="last_name" register={step2Form.register}
          error={step2Form.formState.errors.last_name} placeholder="نام خانوادگی" />
      </div>

      {/* Individual fields */}
      {watchPersonType === 'individual' && (
        <FormInput label="کد ملی" name="national_id" register={step2Form.register}
          placeholder="اختیاری" maxLength={10} />
      )}

      {/* Legal fields */}
      {watchPersonType === 'legal' && (
        <FormInput label="نام شرکت / کارخانه *" name="company_name" register={step2Form.register}
          error={step2Form.formState.errors.company_name} placeholder="نام کامل شرکت" />
      )}

      {/* Buyer: Sub Role (متن آزاد) */}
      {isBuyerRole && (
        <FormInput label="سمت" name="buyer_sub_role" register={step2Form.register}
          placeholder="مثلاً: مدیر کارخانه" icon={<FiBriefcase className="w-5 h-5" />} />
      )}

      {/* Provider: Sub Role */}
      {isProviderRole && (
        <FormSelect label="نوع خدمات‌دهنده" name="provider_sub_role" register={step2Form.register}
          options={providerSubRoles} placeholder="انتخاب کنید" />
      )}

      {/* Provider: Other role */}
      {isProviderRole && watchProviderSubRole === 'other' && (
        <FormInput label="نوع خدمات‌دهنده (سایر)" name="provider_sub_role" register={step2Form.register}
          placeholder="توضیح دهید" />
      )}

      {/* Legal: Contacts */}
      {watchPersonType === 'legal' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">رابطین شرکت</h4>
            <Button variant="outline" size="sm" onClick={addContact}>
              <FiPlus className="ml-1" /> افزودن رابط
            </Button>
          </div>
          {contacts.map((contact, index) => (
            <div key={index} className="flex gap-2 mb-2 items-start">
              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateContact(index, 'name', e.target.value)}
                className="flex-1 border rounded p-2 text-sm"
                placeholder="نام و نام خانوادگی"
              />
              <select
                value={contact.role}
                onChange={(e) => updateContact(index, 'role', e.target.value)}
                className="border rounded p-2 text-sm w-40"
              >
                {contactRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => removeContact(index)} className="p-2 text-red-500">
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" variant="primary" fullWidth isLoading={isRegistering} loadingText="در حال ثبت...">
        ثبت‌نام نهایی
      </Button>

      <button type="button" onClick={() => setStep(1)} className="text-sm text-primary-600 hover:underline text-center block">
        بازگشت به مرحله قبل
      </button>
    </form>
  )
}