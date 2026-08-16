"""
موتور پیش‌بینی خرابی بر اساس داده‌های سنسور
از روش‌های آماری و روندیابی برای پیش‌بینی استفاده می‌کند
"""
from django.utils import timezone
from datetime import timedelta
import numpy as np


class PredictiveEngine:
    """موتور پیش‌بینی خرابی"""
    
    @staticmethod
    def analyze_trend(readings, window_size=10):
        """
        تحلیل روند قرائت‌ها
        برمی‌گرداند: trending_up, trending_down, stable, fluctuating
        """
        if len(readings) < window_size:
            return 'insufficient_data'
        
        values = [r.value for r in readings[:window_size]]
        
        if len(values) < 2:
            return 'insufficient_data'
        
        # محاسبه شیب خط روند
        x = np.arange(len(values))
        y = np.array(values)
        
        if np.std(y) == 0:
            return 'stable'
        
        slope = np.polyfit(x, y, 1)[0]
        
        # محاسبه ضریب تغییرات
        cv = np.std(y) / np.mean(y) if np.mean(y) != 0 else 0
        
        if abs(slope) < 0.01 and cv < 0.05:
            return 'stable'
        elif slope > 0.05:
            return 'trending_up'
        elif slope < -0.05:
            return 'trending_down'
        else:
            return 'fluctuating'
    
    @staticmethod
    def predict_failure_date(sensor, readings, threshold):
        """
        پیش‌بینی تاریخ عبور از آستانه
        بر اساس روند خطی
        """
        if len(readings) < 5:
            return None, 0
        
        values = [r.value for r in readings[:20]]  # حداکثر ۲۰ قرائت آخر
        
        if len(values) < 5:
            return None, 0
        
        x = np.arange(len(values))
        y = np.array(values)
        
        # رگرسیون خطی
        slope, intercept = np.polyfit(x, y, 1)
        
        # اگر روند صعودی نداره یا شیب خیلی کمه
        if slope <= 0:
            return None, 0
        
        # محاسبه زمان رسیدن به آستانه
        readings_to_threshold = (threshold - intercept) / slope
        
        if readings_to_threshold <= 0:
            return timezone.now(), 100
        
        # محاسبه فاصله زمانی بین قرائت‌ها
        if len(readings) >= 2:
            time_diff = (readings[0].recorded_at - readings[-1].recorded_at).total_seconds() / (len(readings) - 1)
        else:
            time_diff = 3600  # پیش‌فرض ۱ ساعت
        
        seconds_to_failure = readings_to_threshold * time_diff
        
        # محاسبه درصد اطمینان
        r_squared = PredictiveEngine._calculate_r_squared(x, y)
        confidence = min(r_squared * 100, 95)
        
        if seconds_to_failure > 365 * 24 * 3600:  # بیشتر از یک سال
            return None, 0
        
        predicted_date = timezone.now() + timedelta(seconds=seconds_to_failure)
        return predicted_date, round(confidence, 1)
    
    @staticmethod
    def _calculate_r_squared(x, y):
        """محاسبه ضریب تعیین (R²)"""
        if len(x) < 2:
            return 0
        
        correlation = np.corrcoef(x, y)[0, 1]
        if np.isnan(correlation):
            return 0
        
        return correlation ** 2
    
    @staticmethod
    def detect_anomalies(readings, threshold=2.0):
        """
        تشخیص آنومالی با روش Z-Score
        readings with |z-score| > threshold are anomalies
        """
        values = np.array([r.value for r in readings])
        
        if len(values) < 5:
            return []
        
        mean = np.mean(values)
        std = np.std(values)
        
        if std == 0:
            return []
        
        z_scores = np.abs((values - mean) / std)
        anomaly_indices = np.where(z_scores > threshold)[0]
        
        return [readings[i] for i in anomaly_indices]
    
    @staticmethod
    def calculate_health_score(asset):
        """
        محاسبه امتیاز سلامت جامع
        ترکیبی از:
        - سن دستگاه
        - وضعیت سنسورها
        - تاریخچه تعمیرات
        - پیش‌بینی‌های فعال
        """
        score = 100.0
        
        # کاهش بر اساس سن
        if asset.installation_date:
            years_old = (timezone.now().date() - asset.installation_date).days / 365
            score -= min(years_old * 2, 25)
        
        # کاهش بر اساس وضعیت سنسورها
        sensors = asset.sensors.filter(is_active=True)
        critical_sensors = 0
        for sensor in sensors:
            if sensor.last_reading is not None:
                if sensor.critical_threshold_high and sensor.last_reading >= sensor.critical_threshold_high:
                    critical_sensors += 1
                elif sensor.critical_threshold_low and sensor.last_reading <= sensor.critical_threshold_low:
                    critical_sensors += 1
        
        score -= critical_sensors * 10
        
        # کاهش بر اساس پیش‌بینی‌های فعال
        active_predictions = asset.failure_predictions.filter(status='active').count()
        score -= active_predictions * 8
        
        # کاهش بر اساس تعمیرات اخیر
        recent_failures = asset.maintenance_logs.filter(
            maintenance_type__in=['corrective', 'emergency'],
            created_at__gte=timezone.now() - timedelta(days=180)
        ).count()
        score -= recent_failures * 5
        
        return max(score, 0)
    
    @staticmethod
    def generate_predictions_for_asset(asset):
        """
        تولید پیش‌بینی برای همه سنسورهای یک دارایی
        """
        predictions = []
        
        for sensor in asset.sensors.filter(is_active=True):
            # دریافت قرائت‌های اخیر
            readings = sensor.readings.filter(
                recorded_at__gte=timezone.now() - timedelta(days=30)
            ).order_by('-recorded_at')
            
            if len(readings) < 10:
                continue
            
            # تحلیل روند
            trend = PredictiveEngine.analyze_trend(readings)
            
            # اگر روند صعودی داره و آستانه بحرانی داره
            if trend == 'trending_up' and sensor.critical_threshold_high:
                predicted_date, confidence = PredictiveEngine.predict_failure_date(
                    sensor, readings, sensor.critical_threshold_high
                )
                
                if predicted_date and confidence > 50:
                    predictions.append({
                        'sensor': sensor,
                        'part': sensor.hotspots.first().part if sensor.hotspots.exists() else None,
                        'title': f'پیش‌بینی خرابی {sensor.name}',
                        'description': (
                            f'روند صعودی {sensor.get_sensor_type_display()} تشخیص داده شد. '
                            f'مقدار فعلی: {sensor.last_reading} {sensor.unit}. '
                            f'آستانه بحرانی: {sensor.critical_threshold_high} {sensor.unit}.'
                        ),
                        'predicted_date': predicted_date,
                        'confidence': confidence,
                        'recommended_action': f'بررسی و سرویس {sensor.name} قبل از {predicted_date.strftime("%Y/%m/%d")}'
                    })
            
            # تشخیص آنومالی
            anomalies = PredictiveEngine.detect_anomalies(readings)
            if anomalies:
                predictions.append({
                    'sensor': sensor,
                    'part': sensor.hotspots.first().part if sensor.hotspots.exists() else None,
                    'title': f'آنومالی در {sensor.name}',
                    'description': (
                        f'{len(anomalies)} قرائت غیرعادی در ۳۰ روز اخیر. '
                        f'آخرین قرائت غیرعادی: {anomalies[0].value} {sensor.unit}'
                    ),
                    'predicted_date': timezone.now() + timedelta(days=7),
                    'confidence': 65,
                    'recommended_action': f'بررسی {sensor.name} از نظر آسیب یا خرابی'
                })
        
        return predictions
    
    @staticmethod
    def run_daily_prediction_job():
        """
        اجرای روزانه پیش‌بینی برای همه دارایی‌ها
        (می‌تواند با Celery یا cron اجرا شود)
        """
        from .models import Asset, FailurePrediction, AssetAlert
        
        assets = Asset.objects.filter(is_active=True, status='operational')
        
        total_predictions = 0
        
        for asset in assets:
            predictions = PredictiveEngine.generate_predictions_for_asset(asset)
            
            for pred in predictions:
                # جلوگیری از تکراری
                existing = FailurePrediction.objects.filter(
                    asset=asset,
                    title=pred['title'],
                    status='active'
                ).exists()
                
                if not existing:
                    prediction = FailurePrediction.objects.create(
                        asset=asset,
                        part=pred.get('part'),
                        title=pred['title'],
                        description=pred['description'],
                        predicted_failure_date=pred['predicted_date'],
                        confidence=pred['confidence'],
                        recommended_action=pred['recommended_action']
                    )
                    
                    # ایجاد هشدار
                    AssetAlert.objects.create(
                        asset=asset,
                        alert_type='failure_prediction',
                        severity='warning' if pred['confidence'] < 80 else 'critical',
                        title=pred['title'],
                        message=pred['description'],
                        recommended_action=pred['recommended_action']
                    )
                    
                    total_predictions += 1
            
            # به‌روزرسانی شاخص سلامت
            asset.health_index = PredictiveEngine.calculate_health_score(asset)
            asset.save()
        
        return total_predictions