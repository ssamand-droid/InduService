import { FiCheckCircle, FiClock, FiTruck, FiPackage, FiXCircle } from 'react-icons/fi'
import { cn } from '@lib/utils'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@lib/constants'

const statusSteps = [
  { status: ORDER_STATUS.PENDING, icon: FiClock, label: ORDER_STATUS_LABELS[ORDER_STATUS.PENDING] },
  { status: ORDER_STATUS.CONFIRMED, icon: FiCheckCircle, label: ORDER_STATUS_LABELS[ORDER_STATUS.CONFIRMED] },
  { status: ORDER_STATUS.PROCESSING, icon: FiPackage, label: ORDER_STATUS_LABELS[ORDER_STATUS.PROCESSING] },
  { status: ORDER_STATUS.SHIPPED, icon: FiTruck, label: ORDER_STATUS_LABELS[ORDER_STATUS.SHIPPED] },
  { status: ORDER_STATUS.DELIVERED, icon: FiCheckCircle, label: ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED] },
]

const statusOrder = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]

export const OrderTimeline = ({ currentStatus }) => {
  // اگر سفارش لغو یا تکمیل شده باشد
  if (currentStatus === ORDER_STATUS.CANCELLED) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <FiXCircle className="h-5 w-5 text-red-500 ml-2" />
        <span className="text-red-600 dark:text-red-400">این سفارش لغو شده است.</span>
      </div>
    )
  }

  if (currentStatus === ORDER_STATUS.COMPLETED) {
    return (
      <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <FiCheckCircle className="h-5 w-5 text-green-500 ml-2" />
        <span className="text-green-600 dark:text-green-400">این سفارش تکمیل شده است.</span>
      </div>
    )
  }

  const currentIndex = statusOrder.indexOf(currentStatus)

  return (
    <div className="relative">
      {/* خط اتصال */}
      <div className="absolute top-5 right-0 left-0 h-0.5 bg-secondary-200 dark:bg-secondary-700 -z-10" />
      <div
        className="absolute top-5 right-0 h-0.5 bg-primary-500 -z-10 transition-all duration-500"
        style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
      />

      <div className="flex justify-between">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const Icon = step.icon

          return (
            <div key={step.status} className="flex flex-col items-center">
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white dark:bg-secondary-800',
                  isCompleted
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-secondary-300 text-secondary-400 dark:border-secondary-600'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  isCurrent
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-secondary-500 dark:text-secondary-400'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}