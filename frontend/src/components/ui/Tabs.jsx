import { useState, createContext, useContext } from 'react'
import { cn } from '@lib/utils'

const TabsContext = createContext()

export const Tabs = ({ children, defaultIndex = 0, onChange, className = '' }) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex)

  const handleChange = (index) => {
    setActiveIndex(index)
    onChange?.(index)
  }

  return (
    <TabsContext.Provider value={{ activeIndex, onChange: handleChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabList = ({ children, className = '' }) => {
  return (
    <div className={cn('flex border-b border-secondary-200 dark:border-secondary-700', className)}>
      {children}
    </div>
  )
}

export const Tab = ({ children, index, className = '' }) => {
  const { activeIndex, onChange } = useContext(TabsContext)
  const isActive = activeIndex === index

  return (
    <button
      onClick={() => onChange(index)}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        'border-b-2 -mb-px',
        isActive
          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200',
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabPanels = ({ children, className = '' }) => {
  const { activeIndex } = useContext(TabsContext)
  return <div className={cn('mt-4', className)}>{children[activeIndex]}</div>
}

export const TabPanel = ({ children }) => {
  return <div>{children}</div>
}