"""
Matching Engine - موتور تطبیق هوشمند پیمانکار
"""
from django.db.models import Q, Avg, Count, F, Value, FloatField, Case, When
from django.db.models.functions import Coalesce


class MatchingEngine:
    """
    موتور تطبیق هوشمند برای یافتن بهترین پیمانکاران

    معیارهای امتیازدهی:
    ۱. امتیاز کاربر (۴۰٪)
    ۲. تطابق تخصص با صنعت (۳۰٪)
    ۳. نزدیکی جغرافیایی (۲۰٪)
    ۴. زمان پاسخگویی (۱۰٪)

    خروجی: ۳ پیمانکار برتر
    """

    MAX_RESULTS = 3

    @classmethod
    def find_best_providers(cls, service_request):
        """
        یافتن بهترین پیمانکاران برای یک درخواست خدمت

        Args:
            service_request: ServiceRequest instance

        Returns:
            list of dict: لیست ۳ پیمانکار برتر با امتیاز
        """
        from users.models import User, Profile

        # ۱. یافتن همه خدمات‌دهندگان (حقیقی و حقوقی)
        providers = User.objects.filter(
            role__in=['service_provider', 'company_provider', 'seller', 'company_seller']
        ).select_related('profile').prefetch_related('services')

        # استخراج کلمات کلیدی از درخواست
        keywords = cls._extract_keywords(service_request)
        buyer_city = service_request.buyer.profile.city if hasattr(service_request.buyer, 'profile') else ''

        results = []

        for provider in providers:
            profile = getattr(provider, 'profile', None)
            if not profile:
                continue

            score = cls._calculate_score(profile, keywords, buyer_city)

            results.append({
                'user_id': provider.id,
                'name': provider.full_name,
                'phone': provider.phone_number,
                'rating': float(profile.rating or 0),
                'rating_count': profile.rating_count,
                'completed_orders': profile.completed_orders,
                'city': profile.city or 'نامشخص',
                'specializations': profile.specializations or 'در حال تکمیل',
                'industries': profile.industries or [],
                'avg_response_time_hours': float(profile.avg_response_time_hours or 0),
                'base_hourly_rate': float(profile.base_hourly_rate or 0),
                'base_daily_rate': float(profile.base_daily_rate or 0),
                'years_of_experience': profile.years_of_experience,
                'is_new': profile.rating_count == 0,
                'score': round(score, 1),
                'score_breakdown': {
                    'rating_score': cls._rating_score(profile),
                    'specialization_score': cls._specialization_score(profile, keywords),
                    'location_score': cls._location_score(profile, buyer_city),
                    'response_time_score': cls._response_time_score(profile),
                }
            })

        # مرتب‌سازی بر اساس امتیاز (نزولی) و گرفتن ۳ نفر برتر
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:cls.MAX_RESULTS]

    @classmethod
    def _calculate_score(cls, profile, keywords, buyer_city):
        """محاسبه امتیاز کلی یک پیمانکار"""
        score = 0

        # ۱. امتیاز کاربر (۴۰٪)
        score += cls._rating_score(profile) * 0.4

        # ۲. تطابق تخصص (۳۰٪)
        score += cls._specialization_score(profile, keywords) * 0.3

        # ۳. نزدیکی جغرافیایی (۲۰٪)
        score += cls._location_score(profile, buyer_city) * 0.2

        # ۴. زمان پاسخگویی (۱۰٪)
        score += cls._response_time_score(profile) * 0.1

        return score

    @classmethod
    def _rating_score(cls, profile):
        """
        امتیاز بر اساس rating کاربر

        کاربر جدید (بدون امتیاز): ۱۵ از ۴۰ (نصف)
        کاربر با rating=5: ۴۰ از ۴۰
        """
        if profile.rating_count == 0 or profile.rating == 0:
            return 15  # کاربر جدید - نصف امتیاز

        return (float(profile.rating) / 5.0) * 40

    @classmethod
    def _specialization_score(cls, profile, keywords):
        """
        امتیاز تطابق تخصص با صنعت مورد نیاز

        اگر تخصصی ثبت نکرده: ۱۰ از ۳۰ (حداقلی)
        اگر تخصص مرتبط دارد: تا ۳۰
        """
        if not profile.specializations:
            return 10  # کاربر جدید بدون تخصص

        specializations = [s.strip().lower() for s in profile.specializations.split(',')]

        # شمارش تعداد تطابق‌ها
        matches = 0
        for spec in specializations:
            for keyword in keywords:
                if keyword.lower() in spec or spec in keyword.lower():
                    matches += 1
                    break

        if matches == 0:
            return 5  # تخصص غیرمرتبط
        elif matches == 1:
            return 20
        elif matches >= 2:
            return 30

        return 10

    @classmethod
    def _location_score(cls, profile, buyer_city):
        """
        امتیاز نزدیکی جغرافیایی

        هم‌شهر: ۲۰
        استان یکسان: ۱۵
        نامشخص: ۱۰
        متفاوت: ۵
        """
        if not buyer_city:
            return 10

        provider_city = profile.city or ''

        if provider_city == buyer_city:
            return 20
        elif profile.province and buyer_city:
            # چک کردن استان (ساده‌سازی شده)
            return 15
        elif not provider_city:
            return 10
        else:
            return 5

    @classmethod
    def _response_time_score(cls, profile):
        """
        امتیاز زمان پاسخگویی

        ≤ ۴ ساعت: ۱۰
        ≤ ۲۴ ساعت: ۷
        ≤ ۴۸ ساعت: ۵
        نامشخص: ۵
        > ۴۸ ساعت: ۲
        """
        hours = float(profile.avg_response_time_hours or 0)

        if hours == 0:
            return 5  # نامشخص
        elif hours <= 4:
            return 10
        elif hours <= 24:
            return 7
        elif hours <= 48:
            return 5
        else:
            return 2

    @classmethod
    def _extract_keywords(cls, service_request):
        """
        استخراج کلمات کلیدی از درخواست خدمت
        """
        keywords = []

        # از عنوان
        if service_request.title:
            keywords.extend(service_request.title.split())

        # از توضیحات
        if service_request.description:
            keywords.extend(service_request.description.split())

        # از اطلاعات تجهیز
        if service_request.equipment_details:
            keywords.extend(service_request.equipment_details.split())

        # از extra_data (فیلدهای اختصاصی صنعت)
        if service_request.extra_data:
            for value in service_request.extra_data.values():
                if isinstance(value, str):
                    keywords.extend(value.split())

        # کلمات کلیدی خاص صنعتی
        industrial_keywords = [
            'پمپ', 'کمپرسور', 'موتور', 'الکتروموتور', 'گیربکس', 'بیرینگ',
            'هیدرولیک', 'پنوماتیک', 'PLC', 'اتوماسیون', 'ابزار دقیق',
            'تعمیر', 'نگهداری', 'اورهال', 'سرویس', 'بازرسی',
            'جوشکاری', 'ماشین‌کاری', 'تراشکاری', 'سیم‌پیچی',
            'نوشابه', 'آب معدنی', 'پتروشیمی', 'نفت', 'گاز',
        ]
        keywords.extend(industrial_keywords)

        return list(set(keywords))  # حذف تکراری‌ها