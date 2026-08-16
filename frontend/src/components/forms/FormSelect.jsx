import { cn } from '@lib/utils'

export const FormSelect = ({
  label,
  name,
  register,
  error,
  options = [],
  placeholder = 'انتخاب کنید...',
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-secondary-400">
            {icon}
          </div>
        )}
        <select
          id={name}
          className={cn(
            'block w-full rounded-lg border border-secondary-300 bg-white px-4 py-2.5 text-secondary-900',
            'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
            'dark:border-secondary-600 dark:bg-secondary-800 dark:text-white',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...register(name)}
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
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>
      )}
    </div>
  )
}