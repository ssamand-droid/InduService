// src/features/provider/steps/LocationCapacityStep.jsx
import React from 'react';

const RESPONSE_TIMES = [
  { value: '24/7', label: '۲۴ ساعته' },
  { value: 'office_hours', label: 'ساعات اداری' },
  { value: 'business_days', label: 'روزهای کاری' },
];

export default function LocationCapacityStep({ form }) {
  const { register, watch, formState: { errors } } = form;
  const hasVehicle = watch('has_vehicle');

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">📍 محدوده و ظرفیت</h3>
        <p className="text-sm text-slate-500 mb-4">
          مشخص کنید در چه محدوده‌ای و با چه ظرفیتی می‌توانید کار کنید
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            استان
          </label>
          <input
            {...register('province')}
            placeholder="مثال: تهران"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            شهر
          </label>
          <input
            {...register('city')}
            placeholder="مثال: تهران"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          حداکثر فاصله (کیلومتر)
        </label>
        <input
          type="number"
          min="0"
          {...register('max_distance_km', { valueAsNumber: true })}
          placeholder="مثال: ۵۰"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        />
        {errors.max_distance_km && (
          <p className="text-red-500 text-xs mt-1">{errors.max_distance_km.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          زمان پاسخگویی
        </label>
        <select
          {...register('response_time')}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        >
          {RESPONSE_TIMES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          حداکثر درخواست همزمان
        </label>
        <input
          type="number"
          min="1"
          {...register('max_concurrent_requests', { valueAsNumber: true })}
          placeholder="مثال: ۳"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        />
        {errors.max_concurrent_requests && (
          <p className="text-red-500 text-xs mt-1">{errors.max_concurrent_requests.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          دستمزد پایه
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              min="0"
              {...register('base_hourly_rate', { valueAsNumber: true })}
              placeholder="دستمزد ساعتی (ریال)"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              min="0"
              {...register('base_daily_rate', { valueAsNumber: true })}
              placeholder="دستمزد روزانه (ریال)"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>
        {errors.base_hourly_rate && (
          <p className="text-red-500 text-xs mt-1">{errors.base_hourly_rate.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition">
          <input
            type="checkbox"
            {...register('has_vehicle')}
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">🚗 وسیله نقلیه دارم</span>
        </label>
      </div>
    </div>
  );
}