// src/components/ui/Select.jsx
import { forwardRef } from 'react'
import { cn } from '@lib/utils'

export const Select = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'انتخاب کنید...',
  error = false,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
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
      <select
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={cn(
          'block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900',
          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:1.25rem] bg-[position:left_0.75rem_center] bg-no-repeat pr-10',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && typeof error === 'string' && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'