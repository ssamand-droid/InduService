// src/components/provider/ProfileIncompleteBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useProviderOnboarding } from '@hooks/useProviderOnboarding';
import { useAuthStore } from '@stores/authStore';

export default function ProfileIncompleteBanner() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = user?.profile || {};
  const { isProfileComplete, requiredFields } = useProviderOnboarding();

  // ========== محاسبه موارد ناقص ==========
  const missingItems = [
    { key: 'service_types_offered', label: 'خدمات قابل ارائه', value: profile?.service_types_offered?.length > 0 },
    { key: 'max_distance_km', label: 'حداکثر فاصله (کیلومتر)', value: !!profile?.max_distance_km },
    { key: 'base_hourly_rate', label: 'دستمزد ساعتی', value: !!profile?.base_hourly_rate },
  ];

  const missingCount = missingItems.filter(item => !item.value).length;

  if (isProfileComplete) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ پروفایل شما ناقص است
            </p>
            <p className="text-sm text-yellow-700">
              برای اعلام قیمت و شروع کار، {missingCount} مورد دیگر را تکمیل کنید:
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              {missingItems.map((item) => (
                <div key={item.key} className="flex items-center gap-1.5 text-xs">
                  {item.value ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <XCircle size={14} className="text-red-400" />
                  )}
                  <span className={item.value ? 'text-green-700' : 'text-red-500'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/provider/onboarding')}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition text-sm font-medium shrink-0"
        >
          تکمیل پروفایل <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}