// src/features/settings/components/SettingForm.jsx
import { useState, useEffect } from 'react'
import { Button, Input, Select, Textarea } from '@components/ui'
import { cn } from '@lib/utils'

const TYPE_OPTIONS = [
  { value: 'general', label: '⚙️ عمومی' },
  { value: 'commission', label: '💰 کمیسیون' },
  { value: 'payment', label: '💳 پرداخت' },
  { value: 'seo', label: '🔍 SEO' },
  { value: 'notification', label: '🔔 اعلان‌ها' },
]

export const SettingForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    title: '',
    setting_type: 'general',
    is_public: false,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        key: initialData.key || '',
        value: initialData.value || '',
        title: initialData.title || '',
        setting_type: initialData.setting_type || 'general',
        is_public: initialData.is_public || false,
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Input
        label="کلید (Key)"
        name="key"
        value={formData.key}
        onChange={handleChange}
        placeholder="مثلاً COMMISSION_RATE"
        required
        disabled={!!initialData}
        dir="ltr"
      />

      <Input
        label="عنوان فارسی"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="توضیح فارسی تنظیم"
      />

      <Textarea
        label="مقدار (Value)"
        name="value"
        value={formData.value}
        onChange={handleChange}
        placeholder="مقدار تنظیم را وارد کنید"
        required
        rows={2}
      />

      <Select
        label="نوع"
        name="setting_type"
        value={formData.setting_type}
        onChange={handleChange}
        options={TYPE_OPTIONS}
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_public"
          name="is_public"
          checked={formData.is_public}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="is_public" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          قابل مشاهده عمومی
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          {initialData ? 'به‌روزرسانی' : 'ایجاد'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            انصراف
          </Button>
        )}
      </div>
    </form>
  )
}