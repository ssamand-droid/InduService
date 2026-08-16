// src/features/provider/ProviderOnboardingWizard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useAuthStore } from '@stores/authStore';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

// استپ‌ها
import ServiceSelectionStep from './steps/ServiceSelectionStep';
import ExpertiseStep from './steps/ExpertiseStep';
import PersonalInfoStep from './steps/PersonalInfoStep';
import LocationCapacityStep from './steps/LocationCapacityStep';
import ConfirmStep from './steps/ConfirmStep';

const STEPS = [
  { id: 'services', label: 'خدمات قابل ارائه', icon: '🔧' },
  { id: 'expertise', label: 'تخصص و مهارت‌ها', icon: '📚' },
  { id: 'personal', label: 'اطلاعات پایه', icon: '👤' },
  { id: 'location', label: 'محدوده و ظرفیت', icon: '📍' },
  { id: 'confirm', label: 'تأیید نهایی', icon: '✅' },
];

const STEP_LABELS = {
  services: 'خدمات قابل ارائه',
  expertise: 'تخصص و مهارت‌ها',
  personal: 'اطلاعات پایه',
  location: 'محدوده و ظرفیت',
  confirm: 'تأیید نهایی',
};

// ============================================================
// Schema
// ============================================================
const onboardingSchema = z.object({
  // مرحله ۱: خدمات
  service_types_offered: z.array(z.string()).min(1, 'حداقل یک خدمت انتخاب کنید'),
  industries: z.array(z.string()).optional(),

  // مرحله ۲: تخصص
  specializations: z.string().optional(),
  years_of_experience: z.coerce.number().min(0, 'عدد معتبر وارد کنید').optional(),
  bio: z.string().optional(),
  education_level: z.string().optional(),
  education_field: z.string().optional(),
  provider_sub_role: z.string().optional(),

  // مرحله ۳: اطلاعات پایه
  first_name: z.string().min(1, 'نام الزامی است'),
  last_name: z.string().min(1, 'نام خانوادگی الزامی است'),
  phone_number: z.string().min(10, 'شماره موبایل الزامی است'),
  person_type: z.enum(['individual', 'legal']),
  national_id: z.string().optional(),
  company_name: z.string().optional(),
  company_registration_number: z.string().optional(),
  tax_id: z.string().optional(),

  // مرحله ۴: محدوده و ظرفیت
  city: z.string().optional(),
  province: z.string().optional(),
  max_distance_km: z.coerce.number().min(0, 'عدد معتبر وارد کنید').optional(),
  response_time: z.string().optional(),
  max_concurrent_requests: z.coerce.number().min(1, 'حداقل ۱').optional(),
  has_vehicle: z.boolean().optional(),
  base_hourly_rate: z.coerce.number().min(0, 'عدد معتبر وارد کنید').optional(),
  base_daily_rate: z.coerce.number().min(0, 'عدد معتبر وارد کنید').optional(),
});

export default function ProviderOnboardingWizard() {
  const navigate = useNavigate();
  const { updateProfile, isUpdatingProfile } = useAuth();
  const user = useAuthStore((state) => state.user);
  const profile = user?.profile || {};

  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // ============================================================
  // فرم
  // ============================================================
  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      // از پروفایل موجود پر می‌شود
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || '',
      person_type: profile?.person_type || 'individual',
      national_id: profile?.national_id || '',
      company_name: profile?.company_name || '',
      company_registration_number: profile?.company_registration_number || '',
      tax_id: profile?.tax_id || '',
      service_types_offered: profile?.service_types_offered || [],
      industries: profile?.industries || [],
      specializations: profile?.specializations || '',
      years_of_experience: profile?.years_of_experience || 0,
      bio: profile?.bio || '',
      education_level: profile?.education_level || '',
      education_field: profile?.education_field || '',
      provider_sub_role: profile?.provider_sub_role || '',
      city: profile?.city || '',
      province: profile?.province || '',
      max_distance_km: profile?.max_distance_km || 50,
      response_time: profile?.response_time || 'office_hours',
      max_concurrent_requests: profile?.max_concurrent_requests || 3,
      has_vehicle: profile?.has_vehicle || false,
      base_hourly_rate: profile?.base_hourly_rate || '',
      base_daily_rate: profile?.base_daily_rate || '',
    },
  });

  const { watch, setValue, getValues, trigger, formState: { errors } } = form;
  const personType = watch('person_type');

  // ============================================================
  // توابع ناوبری
  // ============================================================
  const validateStep = async () => {
    const fieldsToValidate = {
      services: ['service_types_offered'],
      expertise: ['specializations', 'years_of_experience', 'bio', 'education_level', 'education_field', 'provider_sub_role'],
      personal: ['first_name', 'last_name', 'phone_number', 'person_type', 'national_id', 'company_name', 'company_registration_number', 'tax_id'],
      location: ['city', 'province', 'max_distance_km', 'response_time', 'max_concurrent_requests', 'has_vehicle', 'base_hourly_rate', 'base_daily_rate'],
      confirm: [],
    };

    const fields = fieldsToValidate[currentStep.id] || [];
    if (fields.length === 0) return true;

    const result = await trigger(fields);
    return result;
  };

  const next = async () => {
    const isValid = await validateStep();
    if (!isValid) {
      toast.error('لطفاً فیلدهای الزامی را پر کنید');
      return;
    }

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ============================================================
  // ارسال
  // ============================================================
  const handleSubmit = async () => {
    const isValid = await validateStep();
    if (!isValid) {
      toast.error('لطفاً همه فیلدهای الزامی را پر کنید');
      return;
    }

    setLoading(true);
    try {
      const data = getValues();
      await updateProfile(data, {
        onSuccess: () => {
          setSubmitted(true);
          toast.success('✅ پروفایل با موفقیت تکمیل شد!');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        },
        onError: (error) => {
          toast.error(error?.userMessage || 'خطا در ذخیره پروفایل');
        },
      });
    } catch (error) {
      toast.error('خطا در ذخیره پروفایل');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // صفحه موفقیت
  // ============================================================
  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            🎉 پروفایل شما تکمیل شد!
          </h2>
          <p className="text-slate-500 mb-6">
            اکنون می‌توانید درخواست‌های موجود را مشاهده و برای آنها قیمت اعلام کنید.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition font-medium"
          >
            رفتن به داشبورد
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // رندر اصلی
  // ============================================================
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* هدر */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">🚀 تکمیل پروفایل</h1>
        <p className="text-sm text-slate-500 mt-1">برای شروع کار، اطلاعات خود را کامل کنید</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">
            {STEP_LABELS[currentStep.id]}
          </span>
          <span className="text-sm text-slate-400">
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Indicators */}
        <div className="flex justify-between mt-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`text-xs transition-colors ${
                index <= stepIndex ? 'text-blue-600 font-medium' : 'text-slate-300'
              }`}
            >
              {step.icon}
            </div>
          ))}
        </div>
      </div>

      {/* کارت فرم */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
        {currentStep.id === 'services' && (
          <ServiceSelectionStep form={form} />
        )}
        {currentStep.id === 'expertise' && (
          <ExpertiseStep form={form} />
        )}
        {currentStep.id === 'personal' && (
          <PersonalInfoStep form={form} personType={personType} />
        )}
        {currentStep.id === 'location' && (
          <LocationCapacityStep form={form} />
        )}
        {currentStep.id === 'confirm' && (
          <ConfirmStep form={form} data={getValues()} />
        )}
      </div>

      {/* دکمه‌های ناوبری */}
      <div className="flex gap-3">
        {stepIndex > 0 && (
          <button
            onClick={back}
            className="px-6 py-3 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2"
          >
            <ArrowRight size={16} /> قبلی
          </button>
        )}

        {currentStep.id === 'confirm' ? (
          <button
            onClick={handleSubmit}
            disabled={loading || isUpdatingProfile}
            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading || isUpdatingProfile ? (
              <><Loader2 size={18} className="animate-spin" /> در حال ذخیره...</>
            ) : (
              <><CheckCircle size={18} /> تکمیل پروفایل</>
            )}
          </button>
        ) : (
          <button
            onClick={next}
            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            بعدی <ArrowLeft size={16} />
          </button>
        )}
      </div>

      {/* دکمه رد شدن (برای کاربرانی که بعداً تکمیل می‌کنند) */}
      {stepIndex === 0 && (
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition py-2"
        >
          بعداً تکمیل می‌کنم ←
        </button>
      )}
    </div>
  );
}