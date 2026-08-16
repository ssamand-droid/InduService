import { forwardRef } from 'react'
import { cn } from '@lib/utils'

export const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = false,
  disabled = false,
  className = '',
  icon,
  ...props
}, ref) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-secondary-400">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'block w-full rounded-lg border border-secondary-300 bg-white px-4 py-2.5 text-secondary-900',
          'placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'dark:border-secondary-600 dark:bg-secondary-800 dark:text-white dark:placeholder:text-secondary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          icon && 'pr-10',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    </div>
  )
})

Input.displayName = 'Input'