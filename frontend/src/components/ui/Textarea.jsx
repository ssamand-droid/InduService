// src/components/ui/Textarea.jsx
import { forwardRef } from 'react'
import { cn } from '@lib/utils'

export const Textarea = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '',
  rows = 4,
  error = false,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  resize = true,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium text-gray-700 dark:text-gray-300',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn(
          'block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900',
          'placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !resize && 'resize-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && typeof error === 'string' && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'