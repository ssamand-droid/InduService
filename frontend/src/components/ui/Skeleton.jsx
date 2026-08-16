import { cn } from '@lib/utils'

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-secondary-200 dark:bg-secondary-700 rounded ${className}`} />
)

export const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-secondary-800 rounded-xl border p-4">
    <Skeleton className="aspect-square w-full rounded-lg mb-4" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-3 w-full mb-2" />
    <Skeleton className="h-3 w-1/2 mb-4" />
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
)

