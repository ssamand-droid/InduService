import { cn } from '@lib/utils'

const scenarioStepsMap = {
  overhaul: ['بازرسی', 'دمونتاژ', 'شستشو', 'بازرسی قطعات', 'تعمیر', 'مونتاژ', 'تست', 'تحویل'],
  rewinding: ['بررسی اولیه', 'سیم‌برداری', 'تست هسته', 'سیم‌پیچی', 'VPI', 'تست نهایی', 'رنگ', 'تحویل'],
  machining: ['تایید نقشه', 'تهیه مواد', 'ماشین‌کاری', 'عملیات حرارتی', 'کنترل کیفیت', 'تحویل'],
  emergency_repair: ['اعزام تیم', 'عیب‌یابی', 'تعمیر موقت', 'گزارش'],
  calibration: ['ثبت اولیه', 'تنظیم', 'ثبت نهایی', 'صدور گواهی'],
  pm: ['بازرسی', 'روغن‌کاری', 'تنظیم', 'گزارش'],
  ndt: ['آماده‌سازی', 'تست', 'تفسیر', 'گزارش'],
  oil_analysis: ['نمونه‌گیری', 'آزمایش', 'تحلیل', 'توصیه'],
  reverse_eng: ['اسکن', 'مدل‌سازی', 'نقشه', 'تحویل'],
  automation: ['پشتیبان', 'برنامه‌نویسی', 'شبیه‌سازی', 'راه‌اندازی'],
}

export const WorkflowPreview = ({ scenario, className }) => {
  const steps = scenarioStepsMap[scenario] || ['شروع', 'انجام', 'پایان']

  return (
    <div className={cn('flex flex-wrap items-center gap-1 text-sm', className)}>
      {steps.map((step, index) => (
        <span key={index} className="flex items-center">
          <span className="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 rounded text-secondary-700 dark:text-secondary-300">
            {step}
          </span>
          {index < steps.length - 1 && (
            <span className="mx-1 text-primary-500">→</span>
          )}
        </span>
      ))}
    </div>
  )
}