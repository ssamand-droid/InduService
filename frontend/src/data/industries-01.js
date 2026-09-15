export const INDUSTRIES = {
  beverage: {
    id: 'beverage',
    label: 'نوشابه‌سازی / آب معدنی',
    icon: '🥤',
    color: 'from-cyan-500 to-blue-500',
    fields: [
      { name: 'pump_type', label: 'نوع پمپ', type: 'select', options: ['سانتریفیوژ', 'پیستونی', 'دنده‌ای', 'دیافراگمی', 'غیره'] },
      { name: 'flow_rate', label: 'دبی (m³/h)', type: 'number', placeholder: 'مثال: ۴۰۰' },
      { name: 'pressure', label: 'فشار کاری (bar)', type: 'number', placeholder: 'مثال: ۱۰' },
      { name: 'fluid_type', label: 'نوع سیال', type: 'select', options: ['نوشابه', 'آب', 'شربت', 'CIP', 'آمونیاک', 'سایر'] },
      { name: 'temperature', label: 'دمای سیال (°C)', type: 'number', placeholder: 'مثال: ۴' },
    ]
  },

  petrochemical: {
    id: 'petrochemical',
    label: 'پتروشیمی / نفت و گاز',
    icon: '🛢️',
    color: 'from-orange-500 to-red-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['کمپرسور', 'پمپ', 'توربین', 'مبدل حرارتی', 'راکتور', 'سایر'] },
      { name: 'hazardous_area', label: 'منطقه خطرناک', type: 'select', options: ['Zone 0', 'Zone 1', 'Zone 2', 'غیرخطرناک'] },
      { name: 'fluid_type', label: 'نوع سیال', type: 'select', options: ['نفت خام', 'گاز طبیعی', 'پروپان', 'اتیلن', 'آمونیاک', 'سایر'] },
      { name: 'explosion_proof', label: 'ضد انفجار', type: 'select', options: ['Ex d', 'Ex e', 'Ex n', 'غیر anti-ex'] },
      { name: 'pressure_class', label: 'کلاس فشار', type: 'select', options: ['150#', '300#', '600#', '900#', '1500#'] },
    ]
  },

  cement: {
    id: 'cement',
    label: 'سیمان / معدن',
    icon: '🪨',
    color: 'from-stone-500 to-gray-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['سنگ‌شکن', 'آسیاب', 'کوره', 'الواتور', 'نوار نقاله', 'سایر'] },
      { name: 'capacity', label: 'ظرفیت (تن/ساعت)', type: 'number', placeholder: 'مثال: ۲۰۰' },
      { name: 'abrasion_level', label: 'میزان سایش', type: 'select', options: ['کم', 'متوسط', 'زیاد', 'بسیار زیاد'] },
      { name: 'dust_level', label: 'میزان گرد و غبار', type: 'select', options: ['کم', 'متوسط', 'زیاد'] },
    ]
  },

  steel: {
    id: 'steel',
    label: 'فولاد / ذوب آهن',
    icon: '🔥',
    color: 'from-red-600 to-orange-600',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['کوره القایی', 'کوره قوس', 'نورد', 'پاتیل', 'اسلب', 'سایر'] },
      { name: 'temperature', label: 'دمای کاری (°C)', type: 'number', placeholder: 'مثال: ۱۶۰۰' },
      { name: 'cooling_type', label: 'نوع خنک‌کاری', type: 'select', options: ['آبی', 'هوایی', 'روغنی', 'ترکیبی'] },
      { name: 'capacity', label: 'ظرفیت (تن)', type: 'number', placeholder: 'مثال: ۵۰' },
    ]
  },

  pharmaceutical: {
    id: 'pharmaceutical',
    label: 'داروسازی',
    icon: '💊',
    color: 'from-green-500 to-emerald-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['راکتور', 'سانتریفیوژ', 'فیلتر', 'خشک‌کن', 'پرکن', 'سایر'] },
      { name: 'gmp_level', label: 'سطح GMP', type: 'select', options: ['A', 'B', 'C', 'D'] },
      { name: 'clean_room', label: 'Clean Room', type: 'select', options: ['بله', 'خیر'] },
      { name: 'material', label: 'متریال', type: 'select', options: ['SS316L', 'SS304', 'Hastelloy', 'Titanium', 'سایر'] },
    ]
  },

  power_plant: {
    id: 'power_plant',
    label: 'نیروگاهی',
    icon: '⚡',
    color: 'from-yellow-500 to-amber-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'select', options: ['توربین گاز', 'توربین بخار', 'ژنراتور', 'بویلر', 'کندانسور', 'سایر'] },
      { name: 'power_output', label: 'توان خروجی (MW)', type: 'number', placeholder: 'مثال: ۱۶۰' },
      { name: 'cycle_type', label: 'نوع سیکل', type: 'select', options: ['ساده', 'ترکیبی', 'CHP'] },
      { name: 'fuel_type', label: 'نوع سوخت', type: 'select', options: ['گاز طبیعی', 'گازوئیل', 'مازوت', 'دوگانه'] },
    ]
  },

  general: {
    id: 'general',
    label: 'سایر صنایع',
    icon: '🏭',
    color: 'from-blue-500 to-indigo-500',
    fields: [
      { name: 'equipment_type', label: 'نوع تجهیز', type: 'text', placeholder: 'توضیح دهید' },
      { name: 'additional_info', label: 'اطلاعات تکمیلی', type: 'textarea', placeholder: 'هر اطلاعات مفید دیگر...' },
    ]
  },
}

// کشوری که صنایع در آن فعال هستند (برای فیلتر)
export const INDUSTRY_CATEGORIES = [
  { id: 'food_beverage', label: 'غذایی و آشامیدنی', industries: ['beverage'] },
  { id: 'oil_gas', label: 'نفت، گاز و پتروشیمی', industries: ['petrochemical'] },
  { id: 'mining', label: 'معدن و سیمان', industries: ['cement'] },
  { id: 'metal', label: 'فلزات و فولاد', industries: ['steel'] },
  { id: 'pharma', label: 'دارویی و بهداشتی', industries: ['pharmaceutical'] },
  { id: 'power', label: 'نیروگاهی و انرژی', industries: ['power_plant'] },
  { id: 'other', label: 'سایر', industries: ['general'] },
]