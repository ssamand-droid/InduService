import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * ترکیب کلاس‌های Tailwind
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * تابع امن برای فرمت عدد (بدون toLocaleString)
 */
export function safeFormatNumber(num) {
  if (num === undefined || num === null) return '۰'
  const str = Math.floor(Number(num)).toString()
  let result = ''
  for (let i = str.length - 1; i >= 0; i--) {
    result = str[i] + result
    if ((str.length - i) % 3 === 0 && i !== 0) {
      result = ',' + result
    }
  }
  return result
}

/**
 * فرمت قیمت به ریال با جداکننده هزارگان (نسخه امن)
 */
export function formatPriceSafe(price) {
  if (price === null || price === undefined) return '۰ ریال'
  return safeFormatNumber(price) + ' ریال'
}

/**
 * فرمت قیمت به ریال با جداکننده هزارگان (نسخه اصلی - ممکن است در برخی مرورگرها خطا بدهد)
 * از این تابع استفاده نکنید، به جای آن از formatPriceSafe استفاده کنید
 */
export function formatPrice(price) {
  if (price === null || price === undefined) return '۰'
  // اضافه کردن try-catch برای جلوگیری از خطا
  try {
    return Number(price).toLocaleString('fa-IR') + ' ریال'
  } catch (e) {
    // در صورت خطا، از نسخه امن استفاده کن
    return safeFormatNumber(price) + ' ریال'
  }
}

/**
 * فرمت قیمت به تومان
 */
export function formatPriceToman(price) {
  if (price === null || price === undefined) return '۰'
  const toman = Math.round(Number(price) / 10)
  try {
    return toman.toLocaleString('fa-IR') + ' تومان'
  } catch (e) {
    return safeFormatNumber(toman) + ' تومان'
  }
}

/**
 * فرمت امن تاریخ (بدون خطا)
 */
export function formatDateSafe(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

/**
 * تبدیل میلادی به شمسی (تابع خالص - بدون کتابخانه)
 */
function gregorianToJalali(gy, gm, gd) {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 29, 29, 29, 29, 29]
  
  let gy2 = (gm > 2) ? (gy + 1) : gy
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd
  
  for (let i = 0; i < gm - 1; i++) days += gDaysInMonth[i]
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) days++
  
  days -= 492246
  let jy = 1
  while (days > (jy < 30 ? jDaysInMonth[jy - 1] : 29 + (jy % 4 === 3 ? 1 : 0))) {
    days -= (jy < 30 ? jDaysInMonth[jy - 1] : 29 + (jy % 4 === 3 ? 1 : 0))
    jy++
  }
  let jm = 1
  while (true) {
    const jmDays = jm < 30 ? jDaysInMonth[jm - 1] : 29 + (jy % 4 === 3 ? 1 : 0)
    if (days <= jmDays) break
    days -= jmDays
    jm++
  }
  return { jy, jm, jd: days }
}

/**
 * فرمت تاریخ شمسی
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const j = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${j.jd} ${monthNames[j.jm - 1]} ${j.jy} ساعت ${hours}:${minutes}`
}

/**
 * فرمت تاریخ شمسی (فقط تاریخ)
 */
export function formatDateOnly(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const j = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  
  return `${j.jd} ${monthNames[j.jm - 1]} ${j.jy}`
}

/**
 * کوتاه کردن متن
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * ساخت query string از آبجکت
 */
export function buildQueryString(params) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v))
      } else {
        searchParams.append(key, value)
      }
    }
  })
  return searchParams.toString()
}

/**
 * دریافت کلاس رنگ وضعیت سفارش
 */
export function getOrderStatusClass(status) {
  const statusClasses = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  }
  return statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

/**
 * تولید عدد تصادفی
 */
export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Debounce تابع
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args) }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}