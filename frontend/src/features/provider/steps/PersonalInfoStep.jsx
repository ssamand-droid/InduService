// src/features/provider/steps/PersonalInfoStep.jsx
import React from 'react';

export default function PersonalInfoStep({ form, personType }) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-800 mb-4">👤 اطلاعات پایه</h3>
        <p className="text-sm text-slate-500 mb-4">
          اطلاعات هویتی خود را وارد کنید
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            نام <span className="text-red-500">*</span>
          </label>
          <input
            {...register('first_name')}
            placeholder="نام"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
          {errors.first_name && (
            <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            نام خانوادگی <span className="text-red-500">*</span>
          </label>
          <input
            {...register('last_name')}
            placeholder="نام خانوادگی"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
          {errors.last_name && (
            <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          شماره موبایل <span className="text-red-500">*</span>
        </label>
        <input
          {...register('phone_number')}
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        />
        {errors.phone_number && (
          <p className="text-red-500 text-xs mt-1">{errors.phone_number.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          نوع شخص <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'individual', label: '👤 حقیقی' },
            { value: 'legal', label: '🏢 حقوقی' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition ${
                personType === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                {...register('person_type')}
                className="hidden"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {personType === 'individual' ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            کد ملی
          </label>
          <input
            {...register('national_id')}
            placeholder="کد ملی (۱۰ رقمی)"
            maxLength={10}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
        </div>
      ) : (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              نام شرکت <span className="text-red-500">*</span>
            </label>
            <input
              {...register('company_name')}
              placeholder="نام شرکت"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                شماره ثبت
              </label>
              <input
                {...register('company_registration_number')}
                placeholder="شماره ثبت"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                کد اقتصادی
              </label>
              <input
                {...register('tax_id')}
                placeholder="کد اقتصادی"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}