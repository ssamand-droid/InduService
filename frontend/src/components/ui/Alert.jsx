import { cn } from '@lib/utils'
import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from 'react-icons/fi'

const variants = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-400 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    icon: FiCheckCircle,
    iconColor: 'text-green-400 dark:text-green-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-400 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    icon: FiAlertCircle,
    iconColor: 'text-red-400 dark:text-red-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-400 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: FiAlertTriangle,
    iconColor: 'text-yellow-400 dark:text-yellow-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-400 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    icon: FiInfo,
    iconColor: 'text-blue-400 dark:text-blue-500',
  },
}

export const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const { bg, border, text, icon: Icon, iconColor } = variants[variant]

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4',
        bg,
        border,
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={cn('h-5 w-5', iconColor)} aria-hidden="true" />
        </div>
        <div className="mr-3 flex-1">
          {title && <h3 className={cn('text-sm font-medium', text)}>{title}</h3>}
          {children && (
            <div className={cn('text-sm', text, title && 'mt-2')}>
              {children}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
              `focus:ring-offset-${variant}-50`,
              text
            )}
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}