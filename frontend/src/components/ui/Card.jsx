import { cn } from '@lib/utils'

export const Card = ({
  children,
  className = '',
  padding = 'p-6',
  shadow = 'shadow-sm',
  hoverable = false,
  onClick = null,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700',
        shadow,
        padding,
        hoverable && 'transition-shadow hover:shadow-md cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={cn('pb-4 mb-4 border-b border-secondary-200 dark:border-secondary-700', className)}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={cn('text-lg font-semibold text-secondary-900 dark:text-white', className)}>
    {children}
  </h3>
)

export const CardContent = ({ children, className = '' }) => (
  <div className={cn('', className)}>{children}</div>
)

export const CardFooter = ({ children, className = '' }) => (
  <div className={cn('mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700', className)}>
    {children}
  </div>
)