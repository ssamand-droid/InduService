// src/features/provider/steps/ExpertiseStep.jsx
import React from 'react';

const PROVIDER_SUB_ROLES = [
  { value: 'engineer', label: 'مهندس مشاور' },
  { value: 'repairman', label: 'تعمیرکار' },
  { value: 'technician', label: 'تکنسین فنی' },
  { value: 'electrician', label: 'برقکار' },
  { value: 'welder', label: 'جوشکار' },
  { value: 'mechanic', label: 'مکانیک' },
  { value: 'inspector', label: 'بازرس / کنترل کیفیت' },
  { value: 'operator', label: 'اپراتور' },
  { value: 'other', label: 'سایر' },
];

const EDUCATION_LEVELS = [
  { value: 'diploma', label: 'دیپلم' },
  { value: 'associate', label: 'فوق دیپلم' },
  { value: 'bachelor', label: 'لیسانس' },
  { value: 'master', label: 'فوق لیسانس' },
  { value: 'phd', label: 'دکتری' },
];

export default function ExpertiseStep({ form }) {
  const { register, formState: { errors }, watch } = form;
  const watchRole = watch('provider_sub_role');

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">📚 تخصص و مهارت‌ها</h3>
        <p className="text-sm text-slate-500 mb-4">
          اطلاعات تخصصی خود را وارد کنید تا خریداران بهتر بتوانند شما را پیدا کنند
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          نوع خدمات‌دهنده
        </label>
        <select
          {...register('provider_sub_role')}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        >
          <option value="">انتخاب کنید...</option>
          {PROVIDER_SUB_ROLES.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </div>

      {watchRole === 'other' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            تفکیک سایر (متن آزاد)
          </label>
          <input
            {...register('provider_sub_role_custom')}
            maxLength={100}
            placeholder="نوع خدمات‌دهنده را بنویسید"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
          {errors.provider_sub_role_custom && (
            <p className="text-red-500 text-xs mt-1">
              {errors.provider_sub_role_custom.message}
            </p>
          )}
        </div>
      })

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          مدرک تحصیلی
        </label>
        <select
          {...register('education_level')}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        >
          <option value="">انتخاب کنید...</option>
          {EDUCATION_LEVELS.map(level => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          رشته تحصیلی
        </label>
        <input
          {...register('education_field')}
          placeholder="مثال: مهندسی مکانیک، برق صنعتی..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          سال‌های تجربه
        </label>
        <input
          type="number"
          min="0"
          {...register('years_of_experience', { valueAsNumber: true })}
          placeholder="مثال: ۵"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        />
        {errors.years_of_experience && (
          <p className="text-red-500 text-xs mt-1">{errors.years_of_experience.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          تخصص‌ها
        </label>
        <input
          {...register('specializations')}
          placeholder="مثال: تعمیر پمپ، PLC، جوشکاری... (با کاما جدا کنید)"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">تخصص‌های خود را با کاما جدا کنید</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          بیوگرافی / رزومه
        </label>
        <textarea
          {...register('bio')}
          rows={4}
          placeholder="درباره خود، سوابق کاری، پروژه‌های انجام شده..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">
          هرچه دقیق‌تر بنویسید، شانس انتخاب شما بیشتر است
        </p>
      </div>
    </div>
  );
}