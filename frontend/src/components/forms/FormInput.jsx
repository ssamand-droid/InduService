import { Input } from '@components/ui/Input'

export const FormInput = ({
  label,
  name,
  register,
  error,
  type = 'text',
  placeholder = '',
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
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        error={!!error}
        icon={icon}
        {...register(name)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>
      )}
    </div>
  )
}