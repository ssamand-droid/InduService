// src/features/support/components/DisputeForm.jsx
import { useState } from 'react'
import { Button, Select, Textarea } from '@components/ui'
import { cn } from '@lib/utils'

export const DisputeForm = ({
  orders = [],
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    order: '',
    reason: '',
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
      <Select
        label="سفارش"
        name="order"
        value={formData.order}
        onChange={handleChange}
        options={[
          { value: '', label: 'انتخاب سفارش...' },
          ...orders.map(o => ({ value: o.id, label: `#${o.id} - ${o.title || o.description || 'سفارش'}` })),
        ]}
        required
      />

      <Textarea
        label="دلیل اختلاف"
        name="reason"
        value={formData.reason}
        onChange={handleChange}
        placeholder="دلیل ثبت اختلاف را به طور کامل توضیح دهید..."
        rows={5}
        required
      />

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="submit" variant="danger" isLoading={isLoading} className="flex-1">
          ثبت اختلاف
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