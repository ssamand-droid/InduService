import { useState, useEffect } from 'react'

/**
 * هوک debounce برای به تاخیر انداختن بروزرسانی یک مقدار
 * @param {any} value - مقدار ورودی
 * @param {number} delay - تاخیر به میلی‌ثانیه (پیش‌فرض ۵۰۰)
 * @returns {any} مقدار debounced شده
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}