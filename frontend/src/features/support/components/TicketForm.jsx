// src/features/support/components/TicketForm.jsx
import { useState } from 'react'
import { Button, Input, Select, Textarea } from '@components/ui'
import { cn } from '@lib/utils'

const PRIORITY_OPTIONS = [
  { value: 'low', label: '🟢 پایین' },
  { value: 'medium', label: '🟡 متوسط' },
  { value: 'high', label: '🟠 بالا' },
  { value: 'urgent', label: '🔴 فوری' },
]

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'فنی' },
  { value: 'payment', label: 'مالی و پرداخت' },
  { value: 'order', label: 'سفارش' },
  { value: 'account', label: 'حساب کاربری' },
  { value: 'other', label: 'سایر' },
]

export const TicketForm = ({
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    priority: 'medium',
    category: 'other',
    order: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Input
        label="موضوع"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        placeholder="موضوع تیکت را وارد کنید"
        required
      />

      <Textarea
        label="توضیحات"
        name="body"
        value={formData.body}
        onChange={handleChange}
        placeholder="مشکل خود را به طور کامل توضیح دهید..."
        rows={5}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="اولویت"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          options={PRIORITY_OPTIONS}
        />

        <Select
          label="دسته‌بندی"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={CATEGORY_OPTIONS}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
          ارسال تیکت
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