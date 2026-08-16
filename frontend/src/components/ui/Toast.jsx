import React, { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, X, Info } from 'lucide-react'
import { cn } from '@lib/utils'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
}

const Toast = ({ type = 'info', title, message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const Icon = icons[type] || icons.info

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 border rounded-xl p-4 shadow-lg z-50 transition-all duration-300',
        colors[type],
        isLeaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-bold text-sm">{title}</h4>}
          {message && <p className="text-sm mt-0.5 opacity-90">{message}</p>}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 hover:opacity-70 transition"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default Toast