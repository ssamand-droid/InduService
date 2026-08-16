// src/features/settings/components/SettingBulkEditor.jsx
import { useState } from 'react'
import { Button, Textarea } from '@components/ui'
import { cn } from '@lib/utils'
import toast from 'react-hot-toast'

export const SettingBulkEditor = ({
  onBulkUpdate,
  isLoading = false,
  className = '',
}) => {
  const [bulkData, setBulkData] = useState('')

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(bulkData)
      if (!Array.isArray(parsed)) {
        toast.error('داده باید به صورت آرایه از اشیاء باشد')
        return
      }
      onBulkUpdate(parsed)
    } catch (e) {
      toast.error('فرمت JSON نامعتبر است')
    }
  }

  const exampleText = `[
  {"key": "COMMISSION_RATE", "value": "12"},
  {"key": "OTP_EXPIRE_MINUTES", "value": "3"}
]`

  return (
    <div className={cn('space-y-4', className)}>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>راهنما:</strong> تنظیمات را به صورت آرایه JSON وارد کنید.
          <br />
          مثال:
          <br />
          <code className="block mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
            {exampleText}
          </code>
        </p>
      </div>

      <Textarea
        value={bulkData}
        onChange={(e) => setBulkData(e.target.value)}
        placeholder={exampleText}
        rows={6}
        className="font-mono text-sm"
        dir="ltr"
      />

      <Button
        variant="primary"
        onClick={handleSubmit}
        isLoading={isLoading}
        className="w-full sm:w-auto"
      >
        به‌روزرسانی دسته‌ای
      </Button>
    </div>
  )
}