import { cn } from '@lib/utils'

export const FormTextarea = ({
  label,
  name,
  register,
  error,
  placeholder = '',
  rows = 4,
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
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          'block w-full rounded-lg border border-secondary-300 bg-white px-4 py-2.5 text-secondary-900',
          'placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'dark:border-secondary-600 dark:bg-secondary-800 dark:text-white dark:placeholder:text-secondary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...register(name)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>
      )}
    </div>
  )
}