// src/pages/ProfilePage.jsx - نسخه اصلاح شده با تب‌های جدید

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FiUser, FiPhone, FiSave, FiLock, FiCamera,
  FiX, FiBriefcase,
  FiDollarSign, FiShield, FiCheckCircle,
  FiFolder, FiFile, FiImage
} from 'react-icons/fi';
import { useAuthStore } from '@stores/authStore';
import { useAuth } from '@features/auth/hooks/useAuth';
import api from '@lib/axios';
import { Button, Spinner } from '@components/ui';
import { FormInput, FormTextarea, FormSelect } from '@components/forms';
import { SERVICE_SCENARIOS, BUYER_ROLES, PROVIDER_ROLES, ROLE_LABELS } from '@lib/constants';
import PortfolioManager from '@components/profile/PortfolioManager';
import CertificateManager from '@components/profile/CertificateManager';

// ========================
// Schema (همان قبلی)
// ========================
const profileSchema = z.object({
  first_name: z.string().min(1, 'نام الزامی است'),
  last_name: z.string().min(1, 'نام خانوادگی الزامی است'),
  phone_number: z.string().min(10, 'شماره موبایل الزامی است'),
  email: z.string().email('ایمیل نامعتبر است').optional().or(z.literal('')),
  bio: z.string().optional(),
  years_of_experience: z.coerce.number().optional(),
  specializations: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  company_name: z.string().optional(),
  company_registration_number: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_card_number: z.string().optional(),
  bank_shaba: z.string().optional(),
  bank_account_holder: z.string().optional(),
  service_types_offered: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  max_distance_km: z.coerce.number().optional(),
  response_time: z.string().optional(),
  max_concurrent_requests: z.coerce.number().optional(),
  has_vehicle: z.boolean().optional(),
  base_hourly_rate: z.coerce.number().optional(),
  base_daily_rate: z.coerce.number().optional(),
  person_type: z.enum(['individual', 'legal']).optional(),
  national_id: z.string().optional(),
  buyer_sub_role: z.string().optional(),
  provider_sub_role: z.string().optional(),
  education_level: z.string().optional(),
  education_field: z.string().optional(),
});

const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'رمز عبور فعلی الزامی است'),
  new_password: z.string().min(6, 'رمز عبور جدید حداقل ۶ کاراکتر'),
  new_password_confirm: z.string().min(6, 'تکرار رمز عبور الزامی است'),
}).refine(d => d.new_password === d.new_password_confirm, {
  message: 'رمز عبور و تکرار آن یکسان نیستند',
  path: ['new_password_confirm'],
});

// ========================
// کامپوننت تب‌ها
// ========================
const TABS = {
  PERSONAL: 0,
  COMPANY: 1,
  SPECIALTIES: 2,
  DOCUMENTS: 3,
  BANK: 4,
  PASSWORD: 5,
};

// ========================
// Main Component
// ========================
export default function ProfilePage() {
  const qc = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { updateProfile, isUpdatingProfile, uploadAvatar, isUploadingAvatar, changePassword, isChangingPassword } = useAuth();

  const fr = useRef(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [activeTab, setActiveTab] = useState(TABS.PERSONAL);

  useEffect(() => {
    if (!user) {
      logout();
      window.location.href = '/login';
    }
  }, [user, logout]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const isBuyer = BUYER_ROLES.includes(user.role);
  const isProvider = PROVIDER_ROLES.includes(user.role);
  const p = user.profile || {};

  // ========================
  // Forms
  // ========================
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      email: user.email || '',
      bio: p.bio || '',
      years_of_experience: p.years_of_experience || 0,
      specializations: p.specializations || '',
      website: p.website || '',
      linkedin: p.linkedin || '',
      instagram: p.instagram || '',
      company_name: p.company_name || '',
      company_registration_number: p.company_registration_number || '',
      tax_id: p.tax_id || '',
      address: p.address || '',
      city: p.city || '',
      province: p.province || '',
      postal_code: p.postal_code || '',
      bank_name: p.bank_name || '',
      bank_account_number: p.bank_account_number || '',
      bank_card_number: p.bank_card_number || '',
      bank_shaba: p.bank_shaba || '',
      bank_account_holder: p.bank_account_holder || '',
      service_types_offered: p.service_types_offered || [],
      industries: p.industries || [],
      max_distance_km: p.max_distance_km || 50,
      response_time: p.response_time || 'office_hours',
      max_concurrent_requests: p.max_concurrent_requests || 3,
      has_vehicle: p.has_vehicle || false,
      base_hourly_rate: p.base_hourly_rate || '',
      base_daily_rate: p.base_daily_rate || '',
      person_type: p.person_type || 'individual',
      national_id: p.national_id || '',
      buyer_sub_role: p.buyer_sub_role || '',
      provider_sub_role: p.provider_sub_role || '',
      education_level: p.education_level || '',
      education_field: p.education_field || '',
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = profileForm;
  const wpt = watch('person_type');
  const wst = watch('service_types_offered');
  const wi = watch('industries');

  const pwForm = useForm({ resolver: zodResolver(changePasswordSchema) });
  const { register: rp, handleSubmit: hsp, reset: rsp, formState: { errors: pe } } = pwForm;

  // ========================
  // Handlers
  // ========================
  const onSubmit = async (data) => {
    setSuccessMsg('');
    const organizationMemberships = (user.organization_memberships || []).filter(
      (membership) => membership.organization_type === 'factory' || membership.organization_type === 'service_provider'
    );
    const managedOrganizations = organizationMemberships.filter((membership) => ['owner', 'admin'].includes(membership.role));
    if (managedOrganizations.length === 1) {
      const membership = managedOrganizations[0];
      try {
        await api.patch(`/api/organizations/${membership.organization}/`, {
          name: data.company_name,
          registration_number: data.company_registration_number,
          tax_id: data.tax_id,
          address: data.address,
          city: data.city,
          province: data.province,
          postal_code: data.postal_code,
          website: data.website,
        });
      } catch (err) {
        toast.error(err?.userMessage || 'ذخیره اطلاعات سازمان ناموفق بود');
        return;
      }
    }
    updateProfile(data, {
      onSuccess: () => setSuccessMsg('✅ پروفایل با موفقیت بروزرسانی شد'),
      onError: (err) => toast.error(err?.userMessage || 'خطا در ذخیره'),
    });
  };

  const onPwSubmit = (data) => {
    setPwSuccess('');
    setPwError('');
    changePassword(data, {
      onSuccess: () => { setPwSuccess('✅ رمز عبور با موفقیت تغییر کرد'); rsp(); },
      onError: (e) => setPwError(e?.userMessage || 'خطا در تغییر رمز عبور'),
    });
  };

  const handleAvatar = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('فقط فایل‌های تصویری مجاز هستند');
    if (f.size > 2 * 1024 * 1024) return toast.error('حداکثر حجم ۲ مگابایت');
    uploadAvatar(f);
  };

  // ========================
  // تب‌ها
  // ========================
  const tabs = [
    { id: TABS.PERSONAL, label: 'اطلاعات شخصی', icon: FiUser },
    { id: TABS.COMPANY, label: 'اطلاعات شرکت', icon: FiBriefcase },
    ...(isProvider ? [
      { id: TABS.SPECIALTIES, label: 'تخصص و خدمات', icon: FiDollarSign },
      { id: TABS.DOCUMENTS, label: 'نمونه کارها و مدارک', icon: FiFolder },
    ] : []),
    { id: TABS.BANK, label: 'حساب بانکی', icon: FiDollarSign },
    { id: TABS.PASSWORD, label: 'تغییر رمز عبور', icon: FiLock },
  ];

  // ========================
  // Render
  // ========================
  return (
    <div className="bg-slate-50 min-h-screen py-6 md:py-10">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto">

          {/* Header Card */}
          <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white shadow-xl">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]" />

            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <input type="file" ref={fr} className="hidden" accept="image/*" onChange={handleAvatar} />
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg" />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-3xl font-bold shadow-lg">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                  )}
                  <button
                    onClick={() => fr.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                  >
                    {isUploadingAvatar ? <Spinner size="sm" /> : <FiCamera className="h-4 w-4" />}
                  </button>
                </div>

                <div className="text-center md:text-right flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold">{user.full_name}</h1>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-sm mt-2">
                    <FiShield className="h-3.5 w-3.5" />
                    <span>{ROLE_LABELS[user.role] || user.role}</span>
                  </div>
                  {p.bio && <p className="text-sm text-slate-300 mt-3 max-w-md">{p.bio}</p>}
                </div>

                {isProvider && (
                  <div className="flex gap-6 bg-white/10 rounded-2xl px-6 py-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{p.rating || '۰'}</p>
                      <p className="text-xs text-slate-300">امتیاز</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{p.completed_orders || 0}</p>
                      <p className="text-xs text-slate-300">پروژه</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <FiCheckCircle className="text-green-600 h-5 w-5" />
              <span className="text-green-700">{successMsg}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 px-4 md:px-6 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel: Personal Info */}
            {activeTab === TABS.PERSONAL && (
              <div className="p-4 md:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput label="نام *" name="first_name" register={register} error={errors.first_name} />
                    <FormInput label="نام خانوادگی *" name="last_name" register={register} error={errors.last_name} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        ایمیل
                        {user.email?.includes('@induservice.local') && (
                          <span className="text-amber-600 text-xs mr-2">⚠️ پیش‌فرض</span>
                        )}
                      </label>
                      <input
                        type="email"
                        {...register('email')}  // ✅ اینجا register اضافه شد
                        className={`w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                          user.email?.includes('@induservice.local')
                            ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10'
                            : 'border-slate-200 bg-white dark:bg-slate-800'
                        }`}
                        placeholder="ایمیل خود را وارد کنید"
                      />
                      {user.email?.includes('@induservice.local') ? (
                        <p className="text-xs text-amber-600 mt-1">
                          این ایمیل به‌صورت خودکار ساخته شده است. لطفاً ایمیل واقعی خود را وارد کنید.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">
                          ایمیل خود را وارد کنید تا اطلاعیه‌ها را دریافت کنید.
                        </p>
                      )}
                    </div>
                    <FormInput label="شماره موبایل *" name="phone_number" register={register} error={errors.phone_number} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">نوع شخص</h3>
                    <div className="flex gap-3">
                      {[
                        { value: 'individual', label: '👤 حقیقی' },
                        { value: 'legal', label: '🏢 حقوقی' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex-1 p-3 text-center rounded-xl border-2 cursor-pointer transition ${
                            wpt === opt.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <input type="radio" value={opt.value} {...register('person_type')} className="hidden" />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {wpt === 'individual' && (
                    <FormInput label="کد ملی" name="national_id" register={register} maxLength={10} />
                  )}

                  {wpt === 'legal' && (
                    <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <FormInput label="نام شرکت *" name="company_name" register={register} />
                      <FormInput label="شماره ثبت" name="company_registration_number" register={register} />
                      <FormInput label="کد اقتصادی" name="tax_id" register={register} />
                    </div>
                  )}

                  {isBuyer && (
                    <FormInput label="سمت" name="buyer_sub_role" register={register} placeholder="مثلاً: مدیر کارخانه" />
                  )}

                  {isProvider && (
                    <>
                      <FormSelect
                        label="نوع خدمات‌دهنده"
                        name="provider_sub_role"
                        register={register}
                        options={[
                          { value: 'engineer', label: 'مهندس مشاور' },
                          { value: 'repairman', label: 'تعمیرکار' },
                          { value: 'technician', label: 'تکنسین فنی' },
                          { value: 'other', label: 'سایر' },
                        ]}
                      />
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormSelect
                          label="مدرک تحصیلی"
                          name="education_level"
                          register={register}
                          options={[
                            { value: 'diploma', label: 'دیپلم' },
                            { value: 'associate', label: 'فوق دیپلم' },
                            { value: 'bachelor', label: 'لیسانس' },
                            { value: 'master', label: 'فوق لیسانس' },
                            { value: 'phd', label: 'دکتری' },
                          ]}
                        />
                        <FormInput label="رشته تحصیلی" name="education_field" register={register} />
                      </div>
                    </>
                  )}

                  <FormTextarea label="درباره من" name="bio" register={register} rows={3} />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput label="سال تجربه" name="years_of_experience" type="number" register={register} />
                    <FormInput label="تخصص‌ها" name="specializations" register={register} placeholder="با کاما جدا کنید" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormInput label="وبسایت" name="website" register={register} placeholder="https://" />
                    <FormInput label="لینکدین" name="linkedin" register={register} />
                    <FormInput label="اینستاگرام" name="instagram" register={register} />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormInput label="شهر" name="city" register={register} />
                    <FormInput label="استان" name="province" register={register} />
                    <FormInput label="کد پستی" name="postal_code" register={register} />
                  </div>

                  <FormTextarea label="آدرس" name="address" register={register} rows={2} />

                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isUpdatingProfile}
                      loadingText="در حال ذخیره..."
                      className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 py-3"
                    >
                      <FiSave className="ml-2" /> ذخیره تغییرات
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Panel: Company Info */}
            {activeTab === TABS.COMPANY && (
              <div className="p-4 md:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormInput label="نام شرکت" name="company_name" register={register} />
                    <FormInput label="شماره ثبت" name="company_registration_number" register={register} />
                    <FormInput label="کد اقتصادی" name="tax_id" register={register} />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <Button type="submit" variant="primary" isLoading={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                      ذخیره تغییرات
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Panel: Specialties */}
            {activeTab === TABS.SPECIALTIES && isProvider && (
              <div className="p-4 md:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">انواع خدمات قابل ارائه</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                      {Object.entries(SERVICE_SCENARIOS).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                          <input
                            type="checkbox"
                            checked={wst?.includes(key) || false}
                            onChange={(e) => {
                              const current = [...(wst || [])];
                              if (e.target.checked) {
                                current.push(key);
                              } else {
                                const idx = current.indexOf(key);
                                if (idx > -1) current.splice(idx, 1);
                              }
                              setValue('service_types_offered', current);
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">صنایع تحت پوشش</h3>
                    <input
                      type="text"
                      value={wi?.join('، ') || ''}
                      onChange={(e) => setValue('industries', e.target.value.split('،').map(s => s.trim()).filter(Boolean))}
                      className="w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="مثال: پلاستیک، بسته‌بندی، غذایی"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">محدوده و ظرفیت</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormInput label="حداکثر فاصله (کیلومتر)" name="max_distance_km" type="number" register={register} />
                      <FormSelect
                        label="زمان پاسخ"
                        name="response_time"
                        register={register}
                        options={[
                          { value: '24/7', label: '۲۴ ساعته' },
                          { value: 'office_hours', label: 'ساعات اداری' },
                          { value: 'business_days', label: 'روزهای کاری' },
                        ]}
                      />
                      <FormInput label="حداکثر درخواست همزمان" name="max_concurrent_requests" type="number" register={register} />
                      <label className="flex items-center gap-2 p-2">
                        <input type="checkbox" {...register('has_vehicle')} className="rounded border-slate-300 text-blue-600" />
                        <span className="text-sm text-slate-700">وسیله نقلیه دارم</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">قیمت‌گذاری پایه</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormInput label="دستمزد ساعتی (ریال)" name="base_hourly_rate" type="number" register={register} />
                      <FormInput label="دستمزد روزانه (ریال)" name="base_daily_rate" type="number" register={register} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <Button type="submit" variant="primary" isLoading={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                      ذخیره تغییرات
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Panel: Documents (جدید) */}
            {activeTab === TABS.DOCUMENTS && isProvider && (
              <div className="p-4 md:p-6">
                <div className="space-y-8">
                  {/* بخش نمونه کارها */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <FiImage className="text-blue-600 h-5 w-5" />
                      <h3 className="font-semibold text-slate-800">نمونه کارها</h3>
                      <span className="text-xs text-slate-400">تصاویر پروژه‌های انجام شده</span>
                    </div>
                    <PortfolioManager />
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FiFile className="text-blue-600 h-5 w-5" />
                      <h3 className="font-semibold text-slate-800">مدارک و گواهینامه‌ها</h3>
                      <span className="text-xs text-slate-400">مدارک تخصصی، گواهینامه‌ها</span>
                    </div>
                    <CertificateManager />
                  </div>
                </div>
              </div>
            )}

            {/* Panel: Bank Info */}
            {activeTab === TABS.BANK && (
              <div className="p-4 md:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="text-blue-600" />
                    <h4 className="font-medium text-slate-800">اطلاعات بانکی (برای تسویه حساب)</h4>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormInput label="نام بانک" name="bank_name" register={register} />
                    <FormInput label="شماره حساب" name="bank_account_number" register={register} />
                    <FormInput label="شماره کارت" name="bank_card_number" register={register} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput label="شبا" name="bank_shaba" register={register} placeholder="IR..." />
                    <FormInput label="صاحب حساب" name="bank_account_holder" register={register} />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <Button type="submit" variant="primary" isLoading={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                      ذخیره تغییرات
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Panel: Change Password */}
            {activeTab === TABS.PASSWORD && (
              <div className="p-4 md:p-6">
                <form onSubmit={hsp(onPwSubmit)} className="space-y-5 max-w-md">
                  {pwSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <FiCheckCircle className="text-green-600" />
                      <span className="text-green-700">{pwSuccess}</span>
                    </div>
                  )}
                  {pwError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <FiX className="text-red-600" />
                      <span className="text-red-700">{pwError}</span>
                    </div>
                  )}
                  <FormInput label="رمز عبور فعلی" name="old_password" type="password" register={rp} error={pe.old_password} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput label="رمز عبور جدید" name="new_password" type="password" register={rp} error={pe.new_password} />
                    <FormInput label="تکرار رمز عبور جدید" name="new_password_confirm" type="password" register={rp} error={pe.new_password_confirm} />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={isChangingPassword} loadingText="در حال تغییر..." className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                      تغییر رمز عبور
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
