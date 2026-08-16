// src/lib/constants.js

// ==================== وضعیت‌های سفارش ====================
export const ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

// ==================== وضعیت‌های پرداخت ====================
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
}

// ==================== انواع محصول ====================
export const PRODUCT_TYPES = {
  PART: 'part',
  KIT: 'kit',
  RAW: 'raw',
  TOOL: 'tool',
}

// ==================== وضعیت محصول ====================
export const PRODUCT_CONDITIONS = {
  NEW: 'new',
  REFURBISHED: 'refurbished',
  USED: 'used',
}

// ==================== انواع خدمت ====================
export const SERVICE_TYPES = {
  REPAIR: 'repair',
  MAINTENANCE: 'maintenance',
  OVERHAUL: 'overhaul',
  INSPECTION: 'inspection',
  INSTALLATION: 'installation',
  CONSULTING: 'consulting',
}

// ==================== وضعیت درخواست خدمت ====================
export const SERVICE_REQUEST_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// ==================== برچسب‌های فارسی وضعیت سفارش ====================
export const ORDER_STATUS_LABELS = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
  returned: 'مرجوع شده',
}

// ==================== برچسب‌های فارسی انواع خدمت ====================
export const SERVICE_TYPE_LABELS = {
  repair: 'تعمیر',
  maintenance: 'نگهداری',
  overhaul: 'اورهال',
  inspection: 'بازرسی فنی',
  installation: 'نصب و راه‌اندازی',
  consulting: 'مشاوره فنی',
}

// ==================== سناریوهای خدمت ====================
export const SERVICE_SCENARIOS = {
  // گروه ۱: خدمات میدانی
  emergency_repair: 'تعمیرات اضطراری در محل',
  pm: 'نگهداری پیشگیرانه (PM)',
  pdm: 'پایش وضعیت و نگهداری پیش‌بینانه',
  commissioning: 'نصب و راه‌اندازی',
  calibration: 'کالیبراسیون',

  // گروه ۲: تعمیرات کارگاهی
  overhaul: 'تعمیرات اساسی / اورهال',
  rewinding: 'سیم‌پیچی الکتروموتور/ترانس',
  machining: 'ماشین‌کاری و ساخت قطعه',
  special_test: 'تست تخصصی (بالانس، عایقی و ...)',

  // گروه ۳: خدمات مهندسی
  reverse_eng: 'مهندسی معکوس و تهیه نقشه',
  engineering_consult: 'مشاوره مهندسی',
  automation: 'برنامه‌نویسی PLC و اتوماسیون',

  // گروه ۴: تامین و لجستیک
  critical_spare: 'تامین قطعه یدکی بحرانی',
  surplus: 'فروش تجهیزات مازاد',
  loan: 'امانت تجهیز',

  // گروه ۵: قراردادهای بلندمدت
  total_maint: 'قرارداد نت فراگیر',
  consignment: 'انبار امانی (Consignment)',
}

// ==================== گروه‌بندی سناریوها برای نمایش در UI ====================
export const SERVICE_SCENARIO_GROUPS = [
  {
    title: 'خدمات در محل کارخانه',
    icon: '🏭',
    items: ['emergency_repair', 'pm', 'pdm', 'commissioning', 'calibration']
  },
  {
    title: 'تعمیرات کارگاهی (با انتقال)',
    icon: '🔧',
    items: ['overhaul', 'rewinding', 'machining', 'special_test']
  },
  {
    title: 'خدمات مهندسی',
    icon: '⚡',
    items: ['reverse_eng', 'engineering_consult', 'automation']
  },
  {
    title: 'تامین و لجستیک',
    icon: '📦',
    items: ['critical_spare', 'surplus', 'loan']
  },
  {
    title: 'قراردادهای بلندمدت',
    icon: '📄',
    items: ['total_maint', 'consignment']
  },
]

// ========================
// نقش‌های کاربر
// ========================
export const USER_ROLES = {
  BUYER: 'buyer',
  TECHNICIAN: 'technician',
  MAINTENANCE_MANAGER: 'maintenance_manager',
  PROCUREMENT: 'procurement',
  SELLER: 'seller',
  SERVICE_PROVIDER: 'service_provider',
  COMPANY_SELLER: 'company_seller',
  COMPANY_PROVIDER: 'company_provider',
  ADMIN: 'admin',
}

export const ROLE_LABELS = {
  buyer: 'مدیر کارخانه',
  technician: 'تکنسین فنی',
  maintenance_manager: 'مدیر فنی/ نت',
  procurement: 'بازرگانی/تدارکات',
  seller: 'فروشنده (حقیقی)',
  service_provider: 'خدمات‌دهنده (حقیقی)',
  company_seller: 'شرکت فروشنده (حقوقی)',
  company_provider: 'شرکت خدمات‌دهنده (حقوقی)',
  admin: 'مدیر سیستم',
}

// ========================
// نقش‌های خریدار و ارائه‌دهنده
// ========================
export const BUYER_ROLES = ['buyer', 'technician', 'maintenance_manager', 'procurement']
export const PROVIDER_ROLES = ['seller', 'service_provider', 'company_seller', 'company_provider']
export const LEGAL_ROLES = ['company_seller', 'company_provider']