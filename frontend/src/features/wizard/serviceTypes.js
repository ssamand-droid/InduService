// src/features/wizard/serviceTypes.js

export const SERVICE_TYPES = {
  repair: {
    id: 'repair',
    label: 'تعمیر دستگاه / تجهیز',
    icon: '🔧',
    color: 'blue',
    description: 'خرابی، مشکل عملکردی یا توقف خط تولید',
    steps: ['scenario', 'asset', 'problem', 'urgency', 'media', 'confirm'],
  },
  fault_finding: {
    id: 'fault_finding',
    label: 'عیب‌یابی تخصصی',
    icon: '🔍',
    color: 'purple',
    description: 'بررسی علت خرابی مکرر یا افت عملکرد',
    steps: ['asset', 'symptoms', 'history', 'urgency', 'media', 'confirm'],
  },
  electrical: {
    id: 'electrical',
    label: 'برق‌کاری صنعتی',
    icon: '⚡',
    color: 'yellow',
    description: 'تابلو برق، درایو VFD، PLC/HMI، کابل‌کشی',
    steps: ['scenario', 'asset', 'electrical_detail', 'urgency', 'media', 'confirm'],
  },
  part_manufacture: {
    id: 'part_manufacture',
    label: 'ساخت قطعه مکانیکی',
    icon: '⚙️',
    color: 'slate',
    description: 'ساخت از روی نمونه، نقشه یا مهندسی معکوس',
    steps: ['part_info', 'material', 'quantity', 'media', 'confirm'],
  },
  supply: {
    id: 'supply',
    label: 'تامین قطعه / تجهیز',
    icon: '📦',
    color: 'green',
    description: 'خرید، تامین یا واردات قطعه یدکی',
    steps: ['part_info', 'specs', 'quantity', 'confirm'],
  },
  installation: {
    id: 'installation',
    label: 'نصب و راه‌اندازی',
    icon: '🏗️',
    color: 'orange',
    description: 'نصب دستگاه جدید یا راه‌اندازی مجدد',
    steps: ['asset', 'location', 'urgency', 'media', 'confirm'],
  },
}

export const SERVICE_SCENARIO_MAP = {
  repair:          ['emergency_repair', 'overhaul'],
  fault_finding:   ['ndt', 'oil_analysis', 'pdm', 'tpi'],
  electrical:      ['electronics_repair', 'automation', 'emergency_repair'],
  part_manufacture:['machining', 'reverse_eng'],
  supply:          ['critical_spare', 'surplus'],
  installation:    ['commissioning', 'calibration'],
}

export const SCENARIO_OPTIONS = {
  repair: [
    { value: 'emergency_repair', label: 'تعمیرات اضطراری در محل' },
    { value: 'overhaul',         label: 'اورهال / تعمیرات اساسی' },
    { value: 'rewinding',        label: 'سیم‌پیچی الکتروموتور / ترانس' },
    { value: 'special_test',     label: 'تست تخصصی (بالانس، عایقی...)' },
  ],
  fault_finding: [
    { value: 'pdm',          label: 'پایش وضعیت (PdM)' },
    { value: 'ndt',          label: 'تست‌های غیرمخرب (NDT)' },
    { value: 'oil_analysis', label: 'آنالیز روغن' },
    { value: 'tpi',          label: 'بازرسی شخص ثالث (TPI)' },
  ],
  electrical: [
    { value: 'electronics_repair', label: 'تعمیر برد / درایو الکترونیک' },
    { value: 'automation',         label: 'برنامه‌نویسی PLC و اتوماسیون' },
    { value: 'commissioning',      label: 'نصب و راه‌اندازی تابلو برق' },
    { value: 'emergency_repair',   label: 'تعمیرات برق اضطراری' },
  ],
  part_manufacture: [
    { value: 'machining',   label: 'ماشین‌کاری و ساخت قطعه' },
    { value: 'reverse_eng', label: 'مهندسی معکوس و تهیه نقشه' },
  ],
  supply: [
    { value: 'critical_spare', label: 'تامین قطعه یدکی بحرانی' },
    { value: 'surplus',        label: 'تجهیزات مازاد / دست دوم' },
    { value: 'loan',           label: 'امانت تجهیز' },
  ],
  installation: [
    { value: 'commissioning', label: 'نصب و راه‌اندازی دستگاه جدید' },
    { value: 'calibration',   label: 'کالیبراسیون' },
    { value: 'pm',            label: 'نگهداری پیشگیرانه (PM)' },
  ],
}

export const URGENCY_OPTIONS = [
  { value: 'low',      label: 'کم',     desc: 'برنامه‌ریزی‌شده', color: 'green'  },
  { value: 'medium',   label: 'متوسط',  desc: 'این هفته',        color: 'yellow' },
  { value: 'high',     label: 'زیاد',   desc: 'امروز / فردا',    color: 'orange' },
  { value: 'critical', label: 'بحرانی', desc: 'خط متوقف است',    color: 'red'    },
]

export const ELECTRICAL_TYPES = [
  'تابلو برق MCC/MDB', 'درایو فرکانس متغیر (VFD)', 'PLC / HMI',
  'کابل‌کشی صنعتی', 'سیستم روشنایی', 'ترانسفورماتور',
  'UPS / باتری', 'سیستم ارت', 'سایر',
]

export const MATERIAL_TYPES = [
  'فولاد ساده (ST37)', 'فولاد ضد زنگ (316)', 'فولاد ضد زنگ (304)',
  'آلومینیوم', 'برنج', 'مس', 'چدن', 'پلاستیک مهندسی', 'سایر',
]

export const MANUFACTURE_PROCESSES = [
  'تراشکاری (CNC)', 'تراشکاری (Manual)', 'فرزکاری (CNC)', 'فرزکاری (Manual)',
  'جوشکاری', 'برشکاری لیزر', 'EDM (اسپارک)', 'سنگ‌زنی', 'ریخته‌گری', 'سایر',
]
