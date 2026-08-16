// src/features/provider/steps/ConfirmStep.jsx
import React from 'react';
import { SERVICE_SCENARIOS } from '@lib/constants';
import { INDUSTRIES } from '@data/industries';  // ← اگر alias کار می‌کند
// یا
// import { INDUSTRIES } from '../../../data/industries';  // ← مسیر نسبی
import { CheckCircle } from 'lucide-react';

export default function ConfirmStep({ form, data }) {
  const {
    first_name,
    last_name,
    phone_number,
    person_type,
    national_id,
    company_name,
    company_registration_number,
    tax_id,
    service_types_offered = [],
    industries = [],
    specializations,
    years_of_experience,
    bio,
    education_level,
    education_field,
    provider_sub_role,
    city,
    province,
    max_distance_km,
    response_time,
    max_concurrent_requests,
    has_vehicle,
    base_hourly_rate,
    base_daily_rate,
  } = data;

  const educationLabels = {
    diploma: 'دیپلم',
    associate: 'فوق دیپلم',
    bachelor: 'لیسانس',
    master: 'فوق لیسانس',
    phd: 'دکتری',
  };

  const responseLabels = {
    '24/7': '۲۴ ساعته',
    office_hours: 'ساعات اداری',
    business_days: 'روزهای کاری',
  };

  const providerSubLabels = {
    engineer: 'مهندس مشاور',
    repairman: 'تعمیرکار',
    technician: 'تکنسین فنی',
    other: 'سایر',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="text-green-600" size={28} />
        <div>
          <h3 className="font-bold text-slate-800 text-lg">بررسی نهایی</h3>
          <p className="text-sm text-slate-500">لطفاً اطلاعات را بررسی کنید و سپس ثبت کنید</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
        {/* اطلاعات پایه */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">👤 اطلاعات پایه</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">نام و نام خانوادگی</span><span className="font-medium">{first_name} {last_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">شماره موبایل</span><span className="font-medium">{phone_number}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">نوع شخص</span><span className="font-medium">{person_type === 'individual' ? 'حقیقی' : 'حقوقی'}</span></div>
            {person_type === 'individual' && national_id && (
              <div className="flex justify-between"><span className="text-slate-500">کد ملی</span><span className="font-medium">{national_id}</span></div>
            )}
            {person_type === 'legal' && (
              <>
                {company_name && <div className="flex justify-between"><span className="text-slate-500">نام شرکت</span><span className="font-medium">{company_name}</span></div>}
                {company_registration_number && <div className="flex justify-between"><span className="text-slate-500">شماره ثبت</span><span className="font-medium">{company_registration_number}</span></div>}
                {tax_id && <div className="flex justify-between"><span className="text-slate-500">کد اقتصادی</span><span className="font-medium">{tax_id}</span></div>}
              </>
            )}
          </div>
        </div>

        {/* تخصص */}
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📚 تخصص و مهارت</p>
          <div className="space-y-1.5 text-sm">
            {provider_sub_role && (
              <div className="flex justify-between"><span className="text-slate-500">نوع خدمات‌دهنده</span><span className="font-medium">{providerSubLabels[provider_sub_role]}</span></div>
            )}
            {education_level && (
              <div className="flex justify-between"><span className="text-slate-500">مدرک تحصیلی</span><span className="font-medium">{educationLabels[education_level]}</span></div>
            )}
            {education_field && (
              <div className="flex justify-between"><span className="text-slate-500">رشته تحصیلی</span><span className="font-medium">{education_field}</span></div>
            )}
            {years_of_experience > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">سال‌های تجربه</span><span className="font-medium">{years_of_experience} سال</span></div>
            )}
            {specializations && (
              <div className="flex justify-between"><span className="text-slate-500">تخصص‌ها</span><span className="font-medium text-left">{specializations}</span></div>
            )}
            {bio && (
              <div><span className="text-slate-500 text-xs block mb-1">درباره من</span><p className="text-slate-700 text-sm leading-relaxed">{bio}</p></div>
            )}
          </div>
        </div>

        {/* خدمات */}
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">🔧 خدمات قابل ارائه</p>
          <div className="flex flex-wrap gap-1.5">
            {service_types_offered.map(key => (
              <span key={key} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {SERVICE_SCENARIOS[key]}
              </span>
            ))}
          </div>
          {industries.length > 0 && (
            <>
              <p className="text-xs text-slate-400 mt-2">صنایع:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {industries.map(key => (
                  <span key={key} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {INDUSTRIES[key]?.label || key}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* محدوده */}
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📍 محدوده و ظرفیت</p>
          <div className="space-y-1.5 text-sm">
            {(province || city) && (
              <div className="flex justify-between"><span className="text-slate-500">موقعیت</span><span className="font-medium">{province} {city}</span></div>
            )}
            {max_distance_km > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">حداکثر فاصله</span><span className="font-medium">{max_distance_km} کیلومتر</span></div>
            )}
            {response_time && (
              <div className="flex justify-between"><span className="text-slate-500">زمان پاسخگویی</span><span className="font-medium">{responseLabels[response_time]}</span></div>
            )}
            {max_concurrent_requests > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">حداکثر درخواست همزمان</span><span className="font-medium">{max_concurrent_requests}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-500">وسیله نقلیه</span><span className="font-medium">{has_vehicle ? '✅ دارم' : '❌ ندارم'}</span></div>
            {(base_hourly_rate > 0 || base_daily_rate > 0) && (
              <>
                {base_hourly_rate > 0 && <div className="flex justify-between"><span className="text-slate-500">دستمزد ساعتی</span><span className="font-medium">{base_hourly_rate.toLocaleString()} ریال</span></div>}
                {base_daily_rate > 0 && <div className="flex justify-between"><span className="text-slate-500">دستمزد روزانه</span><span className="font-medium">{base_daily_rate.toLocaleString()} ریال</span></div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}