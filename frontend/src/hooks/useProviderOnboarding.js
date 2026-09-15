// src/hooks/useProviderOnboarding.js
import { useAuthStore } from '@stores/authStore';

export const useProviderOnboarding = () => {
  const user = useAuthStore((state) => state.user);
  const profile = user?.profile || {};

  // حداقل فیلدهای مورد نیاز برای اعلام قیمت
  const requiredFields = {
    service_types_offered: profile?.service_types_offered?.length > 0,
    max_distance_km: !!profile?.max_distance_km,
    base_hourly_rate: !!profile?.base_hourly_rate,
  };

  const isProfileComplete = requiredFields.service_types_offered &&
                           requiredFields.max_distance_km &&
                           requiredFields.base_hourly_rate;

  const missingFields = Object.entries(requiredFields)
    .filter(([, isComplete]) => !isComplete)
    .map(([field]) => field);

  const missingCount = missingFields.length;

  return {
    isProfileComplete,
    missingFields,
    missingCount,
    requiredFields,
  };
};