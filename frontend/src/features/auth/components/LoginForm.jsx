import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { Button } from '@components/ui'
import { FormInput } from '@components/forms'
import { useAuth } from '../hooks/useAuth'

// ========================
// Validation Schema
// ========================
const loginSchema = z.object({
  phone_number: z
    .string()
    .min(11, 'شماره موبایل باید ۱۱ رقم باشد')
    .max(11, 'شماره موبایل باید ۱۱ رقم باشد'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر'),
})

// ========================
// Component
// ========================
export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoggingIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: '',
      password: '',
    },
  })

  const onSubmit = (data) => {
    login(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* شماره موبایل */}
      <FormInput
        label="شماره موبایل"
        name="phone_number"
        type="tel"
        register={register}
        error={errors.phone_number}
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        icon={<FiPhone className="w-5 h-5" />}
      />

      {/* رمز عبور */}
      <div className="relative">
        <FormInput
          label="رمز عبور"
          name="password"
          type={showPassword ? 'text' : 'password'}
          register={register}
          error={errors.password}
          placeholder="••••••••"
          icon={<FiLock className="w-5 h-5" />}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-3 top-9 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400"
        >
          {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
        </button>
      </div>

      {/* گزینه‌های اضافی */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-secondary-700 dark:text-secondary-300">
            مرا به خاطر بسپار
          </span>
        </label>
        <Link
          to="/forgot-password"
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          رمز عبور را فراموش کرده‌اید؟
        </Link>
      </div>

      {/* دکمه ورود */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoggingIn}
        loadingText="در حال ورود..."
      >
        ورود به حساب کاربری
      </Button>
    </form>
  )
}