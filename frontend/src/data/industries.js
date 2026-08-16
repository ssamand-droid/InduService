export const INDUSTRIES = {
  // ۱. صنایع غذایی
  food: {
    id: 'food',
    label: 'صنایع غذایی',
    icon: '',
    color: 'from-amber-500 to-orange-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['میکسر', 'فر', 'اکسترودر', 'پرکن', 'بسته‌بندی', 'سردخانه', 'کمپرسور', 'پمپ', 'نوار نقاله', 'سایر'] },
      { name: 'capacity', label: 'ظرفیت (kg/h)', type: 'number', placeholder: 'مثال: ۵۰۰' },
      { name: 'temperature', label: 'دمای کاری (°C)', type: 'number', placeholder: 'مثال: ۱۸۰' },
    ]
  },

  // ۲. نوشابه و آب (فقط بسته‌بندی)
  beverage: {
    id: 'beverage',
    label: 'نوشابه‌سازی / آب معدنی',
    icon: '',
    color: 'from-cyan-500 to-blue-500',
    fields: [
      { name: 'line_capacity_nominal', label: 'ظرفیت اسمی خط (بطری/ساعت)', type: 'number', placeholder: 'مثال: ۴۸۰۰۰' },
      { name: 'line_capacity_actual', label: 'ظرفیت واقعی خط (بطری/ساعت)', type: 'number', placeholder: 'مثال: ۴۶۰۰۰' },
      { name: 'bottle_volume', label: 'حجم بطری', type: 'select', options: ['۲۵۰cc', '۳۰۰cc', '۵۰۰cc', '۱۰۰۰cc', '۱۵۰۰cc', '۲۰۰۰cc'] },
      { name: 'packaging_type', label: 'نوع بسته‌بندی', type: 'select', options: ['PET (پت)', 'بطری شیشه‌ای', 'قوطی (Can)', 'کارتن چندلایه (Tetra Pak)'] },
    ]
  },

  // ۳. داروسازی
  pharmaceutical: {
    id: 'pharmaceutical',
    label: 'داروسازی',
    icon: '',
    color: 'from-green-500 to-emerald-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['راکتور', 'سانتریفیوژ', 'پرکن', 'قرص‌زن', 'بلیستر', 'اتوکلاو', 'هواساز (HVAC)', 'سایر'] },
      { name: 'gmp_level', label: 'سطح GMP', type: 'select', options: ['A', 'B', 'C', 'D'] },
      { name: 'material', label: 'متریال', type: 'select', options: ['SS316L', 'SS304', 'Hastelloy', 'Titanium', 'سایر'] },
    ]
  },

  // ۴. تزریق پلاستیک
  injection_molding: {
    id: 'injection_molding',
    label: 'تزریق پلاستیک',
    icon: '',
    color: 'from-violet-500 to-purple-500',
    fields: [
      { name: 'tonnage', label: 'تناژ دستگاه (Ton)', type: 'number', placeholder: 'مثال: ۲۵۰' },
      { name: 'machine_origin', label: 'سازنده', type: 'select', options: ['اروپایی', 'چینی', 'ایرانی', 'ژاپنی', 'کره‌ای'] },
      { name: 'drive_type', label: 'نوع محرک', type: 'select', options: ['سرو (Servo)', 'هیدرولیک', 'برقی (All Electric)', 'هیبرید'] },
    ]
  },

  // ۵. فرایندی
  process: {
    id: 'process',
    label: 'فرایندی (نفت / گاز / پتروشیمی)',
    icon: '',
    color: 'from-orange-600 to-red-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['کمپرسور', 'پمپ', 'توربین', 'مبدل حرارتی', 'راکتور', 'برج تقطیر', 'کوره', 'بویلر', 'شیرآلات', 'سایر'] },
      { name: 'hazardous_area', label: 'منطقه خطرناک', type: 'select', options: ['Zone 0', 'Zone 1', 'Zone 2', 'Safe Area'] },
      { name: 'explosion_proof', label: 'ضد انفجار', type: 'select', options: ['Ex d', 'Ex e', 'Ex n', 'غیر anti-ex'] },
    ]
  },

  // ۶. سایر
  general: {
    id: 'general',
    label: 'سایر صنایع',
    icon: '',
    color: 'from-blue-500 to-indigo-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'text', placeholder: 'توضیح دهید' },
      { name: 'additional_info', label: 'اطلاعات تکمیلی', type: 'textarea', placeholder: 'هر اطلاعات مفید دیگر...' },
    ]
  },
}

export const INDUSTRY_CATEGORIES = [
  { id: 'food_beverage', label: 'غذایی و آشامیدنی', industries: ['food', 'beverage'] },
  { id: 'pharma', label: 'دارویی', industries: ['pharmaceutical'] },
  { id: 'plastic', label: 'پلاستیک و پلیمر', industries: ['injection_molding'] },
  { id: 'process', label: 'فرایندی و نفت و گاز', industries: ['process'] },
  { id: 'other', label: 'سایر', industries: ['general'] },
]