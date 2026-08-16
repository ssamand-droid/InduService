import { Fragment, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'
import { cn } from '@lib/utils'
import { Button } from './Button'

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer = null,
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* Modal Panel */}
        <div
          className={cn(
            'relative w-full transform rounded-xl bg-white dark:bg-secondary-800 shadow-xl transition-all',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 dark:hover:bg-secondary-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-3 border-t border-secondary-200 dark:border-secondary-700 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تایید عملیات',
  message = 'آیا از انجام این عملیات اطمینان دارید؟',
  confirmText = 'تایید',
  cancelText = 'انصراف',
  variant = 'danger',
  isLoading = false,
}) => {
  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
        {confirmText}
      </Button>
    </>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <p className="text-secondary-700 dark:text-secondary-300">{message}</p>
    </Modal>
  )
}