// src/components/provider/OnboardingGuide.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { useProviderOnboarding } from '@hooks/useProviderOnboarding';
import { X, ChevronRight, ChevronLeft, CheckCircle, Rocket, Target, Sparkles } from 'lucide-react';

const STEPS = [
  {
    id: 'profile',
    title: 'گام ۱: تکمیل پروفایل',
    description: 'اطلاعات تخصصی، خدمات و محدوده کاری خود را کامل کنید تا بتوانید قیمت اعلام کنید',
    icon: '',
    action: 'تکمیل پروفایل',
    path: '/dashboard/provider/onboarding',
    color: 'blue',
    tip: 'حداقل موارد: خدمات قابل ارائه، محدوده، دستمزد'
  },
  {
    id: 'service',
    title: 'گام ۲: ثبت خدمت تخصصی',
    description: 'خدمات خود را به صورت تخصصی ثبت کنید تا خریداران شما را سریعتر پیدا کنند',
    icon: '',
    action: 'ثبت خدمت',
    path: '/dashboard/services/new',
    color: 'purple',
    tip: 'هرچه خدمات شما دقیق‌تر ثبت شود، شانس انتخاب شما بیشتر است'
  },
  {
    id: 'request',
    title: 'گام ۳: شروع به کار',
    description: 'درخواست‌های موجود را بررسی و برای آنها قیمت اعلام کنید',
    icon: '',
    action: 'مشاهده درخواست‌ها',
    path: '/dashboard/service-requests',
    color: 'green',
    tip: 'هرچه سریعتر پاسخ دهید، شانس بیشتری برای انتخاب دارید'
  },
];

export default function OnboardingGuide() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isProfileComplete, missingCount } = useProviderOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('induservice_onboarding_seen');
    const isNewUser = user?.date_joined &&
      (new Date() - new Date(user.date_joined)) < 24 * 60 * 60 * 1000;

    // اگر کاربر جدید است یا پروفایل کامل نیست، راهنما را نمایش بده
    if ((isNewUser || !isProfileComplete) && !hasSeenGuide) {
      setShowGuide(true);
    } else {
      setShowGuide(false);
    }
  }, [user, isProfileComplete]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('induservice_onboarding_seen', 'true');
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAction = (path) => {
    handleClose();
    navigate(path);
  };

  if (!showGuide || !isVisible) return null;

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      glow: 'shadow-blue-200/50',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700',
      glow: 'shadow-purple-200/50',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
      glow: 'shadow-green-200/50',
    },
  };

  const colors = colorClasses[step.color] || colorClasses.blue;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div className={`bg-white rounded-3xl max-w-md w-full shadow-2xl ${colors.glow} overflow-hidden animate-fade-in-up`}>
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Rocket className="text-blue-600" size={20} />
              <h2 className="font-bold text-slate-800">🚀 شروع سریع</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>مرحله {currentStep + 1} از {STEPS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors.button}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* مرحله */}
            <div className="text-center py-3">
              <div className={`text-5xl mb-3 inline-block p-4 rounded-2xl ${colors.bg}`}>
                {step.icon}
              </div>
              <h3 className={`text-xl font-bold ${colors.text}`}>
                {step.title}
              </h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                {step.description}
              </p>
              {step.tip && (
                <p className="text-xs text-slate-400 mt-2 bg-slate-50 rounded-xl p-2">
                  {step.tip}
                </p>
              )}
            </div>

            {/* دکمه‌ها */}
            <div className="flex gap-3 pt-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition text-sm font-medium flex items-center gap-1.5"
                >
                  <ChevronRight size={16} /> قبلی
                </button>
              )}
              <button
                onClick={() => handleAction(step.path)}
                className={`flex-1 py-2.5 ${colors.button} text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg`}
              >
                {currentStep === STEPS.length - 1 ? (
                  <><CheckCircle size={16} /> شروع کار</>
                ) : (
                  <>{step.action} <ChevronLeft size={16} /></>
                )}
              </button>
            </div>

            {/* نقاط راهنما */}
            <div className="flex justify-center gap-1.5 pt-2">
              {STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? `w-6 ${colors.button}`
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* دکمه رد شدن */}
            <button
              onClick={handleClose}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition py-1"
            >
              رد کردن و ادامه
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}