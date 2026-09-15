// src/components/common/TourGuide.jsx
import React, { useState, useEffect } from 'react';
import Joyride from 'react-joyride';
import { useAuthStore } from '@stores/authStore';
import { BUYER_ROLES } from '@lib/constants';
import { HelpCircle, Package, Wrench, X } from 'lucide-react';

// ============================================================
// هوک سفارشی برای دریافت مسیر بدون useLocation
// ============================================================
function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    // همچنین تغییرات pushState و replaceState را رصد کنید
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setPathname(window.location.pathname);
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setPathname(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return pathname;
}

// ============================================================
// استایل‌های سفارشی
// ============================================================
const TOUR_STYLES = {
  options: {
    primaryColor: '#2563eb',
    textColor: '#1e293b',
    zIndex: 1000,
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    spotlightPadding: 12,
    beaconRadius: 8,
  },
  spotlight: {
    borderRadius: '12px',
    padding: '8px',
  },
  buttonNext: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '8px 20px',
    fontSize: '14px',
  },
  buttonBack: {
    color: '#64748b',
    borderRadius: '10px',
    padding: '8px 16px',
    fontSize: '14px',
  },
  buttonSkip: {
    color: '#94a3b8',
    fontSize: '13px',
  },
  tooltip: {
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '380px',
  },
  tooltipTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tooltipContent: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
  },
};

// ============================================================
// مراحل راهنما برای خریدار
// ============================================================
const BUYER_TOUR_STEPS = [
  {
    target: '[data-tour="dashboard"]',
    title: '🏠 داشبورد خریدار',
    content: 'به داشبورد خود خوش آمدید! از اینجا می‌توانید همه چیز را مدیریت کنید.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="assets"]',
    title: '🏭 ثبت دارایی',
    content: 'دستگاه‌ها و تجهیزات خود را ثبت کنید تا درخواست‌های تعمیر سریعتر انجام شود.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="request-service"]',
    title: '🔧 درخواست خدمت',
    content: 'برای دستگاه‌های خود درخواست تعمیر یا سرویس ثبت کنید.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="service-requests"]',
    title: '📋 پیگیری درخواست‌ها',
    content: 'وضعیت درخواست‌های خود را مشاهده و بهترین پیشنهاد را انتخاب کنید.',
    placement: 'top',
    disableBeacon: true,
  },
];

// ============================================================
// مراحل راهنما برای فروشنده (محصول)
// ============================================================
const SELLER_TOUR_STEPS = [
  {
    target: '[data-tour="dashboard"]',
    title: '🏠 داشبورد فروشنده',
    content: 'به داشبورد خود خوش آمدید! از اینجا می‌توانید محصولات خود را مدیریت کنید.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="products"]',
    title: '📦 گام ۱: ثبت محصول',
    content: 'روی دکمه "ثبت محصول جدید" در هدر یا بخش اقدامات سریع کلیک کنید.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="manage-orders"]',
    title: '📋 گام ۲: مدیریت سفارشات',
    content: 'سفارشات خود را در این بخش مدیریت و پیگیری کنید.',
    placement: 'top',
    disableBeacon: true,
  },
];

// ============================================================
// مراحل راهنما برای خدمات‌دهنده
// ============================================================
const PROVIDER_TOUR_STEPS = [
  {
    target: '[data-tour="dashboard"]',
    title: '🏠 داشبورد خدمات‌دهنده',
    content: 'به داشبورد خود خوش آمدید! از اینجا می‌توانید خدمات خود را مدیریت کنید.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile"]',
    title: '👤 گام ۱: تکمیل پروفایل',
    content: 'روی دکمه "تکمیل پروفایل" در بخش اقدامات سریع کلیک کنید.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="services"]',
    title: '🚀 گام ۲: ثبت خدمت تخصصی',
    content: 'روی دکمه "ثبت خدمت جدید" در بخش اقدامات سریع کلیک کنید.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="portfolio"]',
    title: '📁 گام ۳: نمونه کارها',
    content: 'روی دکمه "نمونه کارها" کلیک کنید تا تصاویر پروژه‌های خود را آپلود کنید.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="service-requests"]',
    title: '📋 گام ۴: مشاهده درخواست‌ها',
    content: 'درخواست‌های موجود را بررسی و برای آنها قیمت اعلام کنید.',
    placement: 'top',
    disableBeacon: true,
  },
];

// ============================================================
// کامپوننت انتخاب مسیر
// ============================================================
const PathSelector = ({ onSelect, onSkip, user }) => {
  const isSeller = user?.role === 'seller' || user?.role === 'company_seller';
  const isServiceProvider = user?.role === 'service_provider' || user?.role === 'company_provider';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">🚀 شروع سریع</h2>
            <button
              onClick={onSkip}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            لطفاً مسیر خود را انتخاب کنید:
          </p>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={() => onSelect('provider')}
            className="w-full text-right p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition">
                <Wrench className="text-purple-600" size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">🔧 مسیر خدمات‌دهنده</h3>
                <p className="text-sm text-slate-500">
                  ثبت خدمت جدید و مدیریت درخواست‌ها
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ⚠️ نیاز به تکمیل پروفایل تخصصی
                </p>
                {!isServiceProvider && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ برای خدمات‌دهنده شدن، نقش خود را در پروفایل تغییر دهید
                  </p>
                )}
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('seller')}
            className="w-full text-right p-5 rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
                <Package className="text-blue-600" size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">📦 مسیر فروشنده</h3>
                <p className="text-sm text-slate-500">
                  ثبت محصول جدید و مدیریت فروش
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ⏱️ تکمیل پروفایل اجباری نیست
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onSkip}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition py-2 mt-2"
          >
            بعداً تصمیم می‌گیرم
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// کامپوننت اصلی
// ============================================================
export default function TourGuide() {
  // ========== استفاده از هوک سفارشی به جای useLocation ==========
  const pathname = usePathname();
  // ================================================================

  const user = useAuthStore((state) => state.user);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourKey, setTourKey] = useState(0);
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

  // ========== فقط در صفحات داشبورد نمایش داده شود ==========
  const isDashboard = pathname?.startsWith('/dashboard') || false;

  const isBuyer = BUYER_ROLES.includes(user?.role);
  const isSeller = user?.role === 'seller' || user?.role === 'company_seller';
  const isServiceProvider = user?.role === 'service_provider' || user?.role === 'company_provider';

  let steps = [];
  if (isBuyer) {
    steps = BUYER_TOUR_STEPS;
  } else if (selectedPath === 'provider') {
    steps = PROVIDER_TOUR_STEPS;
  } else if (selectedPath === 'seller') {
    steps = SELLER_TOUR_STEPS;
  }

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('induservice_tour_seen');
    const isNewUser = user?.date_joined &&
      (new Date() - new Date(user.date_joined)) < 48 * 60 * 60 * 1000;

    if (isNewUser && !hasSeenTour && !isBuyer) {
      setShowPathSelector(true);
    } else if (isBuyer && isNewUser && !hasSeenTour && isDashboard) {
      setTimeout(() => setRun(true), 1000);
    }
  }, [user, isBuyer, isDashboard]);

  const handlePathSelect = (path) => {
    setSelectedPath(path);
    setShowPathSelector(false);
    localStorage.setItem('induservice_selected_path', path);
    setStepIndex(0);
    setTimeout(() => setRun(true), 500);
  };

  const handlePathSkip = () => {
    setShowPathSelector(false);
    localStorage.setItem('induservice_tour_seen', 'true');
  };

  const handleJoyrideCallback = (data) => {
    const { status, type, index, action } = data;

    const FINISHED = 'finished';
    const SKIPPED = 'skipped';

    if ([FINISHED, SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('induservice_tour_seen', 'true');
    }

    if (type === 'step:after') {
      if (action === 'next') {
        setStepIndex(index + 1);
      } else if (action === 'prev') {
        setStepIndex(index - 1);
      } else if (action === 'close' || action === 'skip') {
        setRun(false);
        localStorage.setItem('induservice_tour_seen', 'true');
      }
    }

    if (type === 'error') {
      console.warn('⚠️ Joyride Error, skipping to next step');
      setStepIndex(prev => prev + 1);
    }
  };

  // ============================================================
  // باز کردن مجدد راهنما
  // ============================================================
  const handleOpenTour = () => {
    if (!isDashboard) {
      window.location.href = '/dashboard';
      return;
    }

    setRun(false);
    setStepIndex(0);

    if (!isBuyer) {
      setSelectedPath(null);
      setShowPathSelector(true);
      return;
    }

    if (isBuyer) {
      setTourKey(prev => prev + 1);
      setTimeout(() => setRun(true), 200);
    }
  };

  const shouldShowTour = isBuyer || (selectedPath && steps.length > 0);

  // ========== اگر در داشبورد نیست، هیچ چیزی نمایش نده ==========
  if (!isDashboard) return null;

  return (
    <>
      {showPathSelector && (
        <PathSelector onSelect={handlePathSelect} onSkip={handlePathSkip} user={user} />
      )}

      {user && (
        <button
          onClick={handleOpenTour}
          className="fixed bottom-20 right-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 group"
          aria-label="راهنمای استفاده"
        >
          <HelpCircle size={24} />
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            راهنمای استفاده
          </span>
        </button>
      )}

      {shouldShowTour && steps.length > 0 && (
        <Joyride
          key={tourKey}
          steps={steps}
          run={run}
          continuous={true}
          showProgress={true}
          showSkipButton={true}
          stepIndex={stepIndex}
          callback={handleJoyrideCallback}
          styles={TOUR_STYLES}
          disableOverlayClose={true}
          debug={false}
          scrollToFirstStep={true}
          scrollOffset={100}
          locale={{
            back: 'برگشت',
            close: 'بستن',
            last: 'پایان',
            next: 'بعدی',
            skip: 'رد کردن',
            step: 'مرحله',
          }}
        />
      )}

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
          animation: fadeInUp 0.3s ease-out forwards;
        }

        .react-joyride__spotlight {
          margin-top: 20px !important;
        }

        @media (max-width: 640px) {
          .react-joyride__tooltip {
            max-width: 90vw !important;
            margin: 0 10px !important;
          }
          .react-joyride__tooltip__title {
            font-size: 14px !important;
          }
          .react-joyride__tooltip__content {
            font-size: 13px !important;
          }
        }
      `}</style>
    </>
  );
}