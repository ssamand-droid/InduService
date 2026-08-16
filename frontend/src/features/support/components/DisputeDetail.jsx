// src/features/support/components/DisputeDetail.jsx
import { Badge, Button, Spinner } from '@components/ui'
import { cn, formatDate } from '@lib/utils'

const RESOLUTION_COLORS = {
  pending: 'warning',
  to_provider: 'success',
  to_buyer: 'danger',
  partial: 'info',
}

const RESOLUTION_LABELS = {
  pending: 'در انتظار',
  to_provider: 'پرداخت به متخصص',
  to_buyer: 'بازگشت به خریدار',
  partial: 'تقسیم شده',
}

export const DisputeDetail = ({
  dispute,
  isLoading = false,
  isAdmin = false,
  onResolve,
  className = '',
}) => {
  const [resolution, setResolution] = useState('')
  const [note, setNote] = useState('')

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>اختلافی یافت نشد</p>
      </div>
    )
  }

  const isResolved = dispute.resolution !== 'pending'

  return (
    <div className={cn('space-y-6', className)}>
      {/* اطلاعات اختلاف */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            اختلاف سفارش #{dispute.order?.id || 'نامشخص'}
          </h2>
          <Badge variant={RESOLUTION_COLORS[dispute.resolution] || 'secondary'}>
            {RESOLUTION_LABELS[dispute.resolution] || dispute.resolution}
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">تاریخ ثبت:</span>
            <span className="mr-2 text-gray-700 dark:text-gray-300">
              {formatDate(dispute.created_at)}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">دلیل:</span>
            <p className="mt-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              {dispute.reason}
            </p>
          </div>
          {dispute.admin_note && (
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">یادداشت ادمین:</span>
              <p className="mt-1 text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                {dispute.admin_note}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* فرم حل اختلاف (ادمین) */}
      {isAdmin && !isResolved && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
            حل اختلاف
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نتیجه *
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              >
                <option value="">انتخاب کنید...</option>
                <option value="to_provider">پرداخت به متخصص</option>
                <option value="to_buyer">بازگشت به خریدار</option>
                <option value="partial">تقسیم بین طرفین</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                یادداشت ادمین
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="توضیح دهید چرا این نتیجه انتخاب شده است..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <Button
              variant="primary"
              onClick={() => onResolve({ resolution, note })}
              disabled={!resolution}
            >
              ثبت نتیجه
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}