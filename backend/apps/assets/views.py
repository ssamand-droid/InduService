from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models as django_models
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from users.models import Profile
# import pandas as pd
from django.http import HttpResponse
import csv
import io

from .models import (
    AssetCategory, Asset, AssetPart, AssetDocument,
    AssetHealthLog, AssetMaintenanceLog, AssetAlert,
    DigitalTwinHotspot, AssetImportBatch, 
    Sensor, SensorReading, Hotspot, MaintenanceSchedule, FailurePrediction
)
from .serializers import (
    AssetCategorySerializer, AssetListSerializer, AssetDetailSerializer,
    AssetCreateSerializer, AssetPartSerializer, AssetDocumentSerializer,
    AssetHealthLogSerializer, AssetMaintenanceLogSerializer,
    AssetAlertSerializer, DigitalTwinHotspotSerializer,
    AssetImportBatchSerializer, 
    SensorSerializer, SensorReadingSerializer, HotspotSerializer,
    MaintenanceScheduleSerializer, FailurePredictionSerializer
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return True


class SubscriptionLimitMixin:
    """میکسین برای محدودیت اشتراک"""
    MAX_FREE_ASSETS = 5

    def get_asset_limit(self, user):
        """دریافت حداکثر دارایی مجاز بر اساس اشتراک"""
        try:
            from subscription.models import Subscription
            active_sub = Subscription.get_active_subscription(user)
            if active_sub:
                return active_sub.max_assets_allowed
        except ImportError:
            pass
        return self.MAX_FREE_ASSETS

    def check_asset_limit(self, user, new_count=1):
        current_count = Asset.objects.filter(owner=user, is_active=True).count()
        max_limit = self.get_asset_limit(user)
        
        if current_count + new_count > max_limit:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                detail={
                    'error': 'محدودیت دارایی',
                    'message': f'حداکثر {max_limit} دارایی مجاز است. شما {current_count} دارایی ثبت کرده‌اید.',
                    'current': current_count,
                    'limit': max_limit,
                    'remaining': max(0, max_limit - current_count),
                    'upgrade_required': True
                }
            )


class AssetCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetCategory.objects.filter(parent=None)
    serializer_class = AssetCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class AssetViewSet(SubscriptionLimitMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'tag_number', 'brand', 'model_number', 'location']
    ordering_fields = ['name', 'health_index', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        
        # دریافت company_name از پروفایل (اگر کاربر حقوقی است)
        try:
            profile = user.profile
            if profile.person_type == 'legal' and profile.company_name:
                # کاربران یک شرکت همه دارایی‌های هم را می‌بینند
                return Asset.objects.filter(
                    owner__profile__company_name=profile.company_name,
                    is_active=True
                ).distinct()
        except Profile.DoesNotExist:
            pass
        
        # کاربران حقیقی فقط دارایی‌های خودشان
        return Asset.objects.filter(owner=user, is_active=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return AssetListSerializer
        elif self.action == 'create':
            return AssetCreateSerializer
        return AssetDetailSerializer

    def create(self, request, *args, **kwargs):
        """پشتیبانی از FormData برای آپلود تصویر"""
        # اگر multipart/form-data باشه
        if request.content_type and 'multipart' in request.content_type:
            serializer = self.get_serializer(data=request.data)
        else:
            serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        self.check_asset_limit(request.user)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """ایجاد دارایی با محدودیت اشتراک"""
        self.check_asset_limit(self.request.user)
        asset = serializer.save()
        
        # ثبت گزارش سلامت اولیه
        AssetHealthLog.objects.create(
            asset=asset,
            health_index=100.0,
            recorded_by=self.request.user,
            technician_notes=f"ثبت اولیه دستگاه {asset.name}"
        )
        return asset

    @action(detail=True, methods=['post'])
    def update_health(self, request, pk=None):
        asset = self.get_object()
        serializer = AssetHealthLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(asset=asset, recorded_by=request.user)
            return Response({
                'message': 'گزارش سلامت ثبت شد',
                'new_health_index': asset.health_index
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def emergency_stop(self, request, pk=None):
        asset = self.get_object()
        alert = AssetAlert.objects.create(
            asset=asset,
            alert_type='failure_prediction',
            severity='critical',
            title=f'وضعیت اضطراری - {asset.name}',
            message=f'اعلام وضعیت اضطراری توسط {request.user.get_full_name()}',
            recommended_action='بررسی فوری دستگاه و سفارش قطعات بحرانی'
        )
        asset.status = 'maintenance'
        asset.save()

        critical_parts = asset.parts.filter(criticality='vital')
        return Response({
            'alert_id': alert.id,
            'message': 'وضعیت اضطراری ثبت شد',
            'critical_parts': AssetPartSerializer(critical_parts, many=True).data,
            'downtime_cost_per_hour': float(asset.hourly_downtime_cost)
        })

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        asset = self.get_object()
        thirty_days_ago = timezone.now() - timedelta(days=30)

        return Response({
            'asset': AssetDetailSerializer(asset).data,
            'stats': {
                'total_downtime_hours': asset.maintenance_logs.filter(
                    created_at__gte=thirty_days_ago
                ).aggregate(total=Sum('downtime_hours'))['total'] or 0,
                'total_maintenance_cost': float(
                    asset.maintenance_logs.filter(created_at__gte=thirty_days_ago).aggregate(
                        total=Sum('labor_cost') + Sum('parts_cost')
                    )['total'] or 0
                ),
            },
            'open_alerts': AssetAlertSerializer(
                asset.alerts.filter(is_read=False)[:5], many=True
            ).data,
        })

    @action(detail=False, methods=['get'])
    def global_dashboard(self, request):
        assets = self.get_queryset()
        return Response({
            'total_assets': assets.count(),
            'assets_by_status': {
                'operational': assets.filter(status='operational').count(),
                'degraded': assets.filter(status='degraded').count(),
                'maintenance': assets.filter(status='maintenance').count(),
            },
            'average_health': assets.aggregate(avg=Avg('health_index'))['avg'] or 0,
            'critical_alerts': AssetAlert.objects.filter(
                asset__owner=request.user, severity='critical', is_read=False
            ).count(),
            'upcoming_maintenance': assets.filter(
                next_maintenance_date__lte=timezone.now() + timedelta(days=7)
            ).count(),
            'asset_limit': {
                'current': assets.count(),
                'max': self.MAX_FREE_ASSETS,
                'remaining': max(0, self.MAX_FREE_ASSETS - assets.count())
            }
        })

    @action(detail=False, methods=['post'])
    def bulk_import_excel(self, request):
        """واردات انبوه از فایل Excel"""
        import pandas as pd  # ← اینجا import شود
        
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'فایل الزامی است'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                df = pd.read_csv(file)
        except Exception as e:
            return Response({'error': f'خطا در خواندن فایل: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # بررسی محدودیت
        try:
            self.check_asset_limit(request.user, len(df))
        except Exception as e:
            return Response(e.detail if hasattr(e, 'detail') else str(e), 
                          status=status.HTTP_403_FORBIDDEN)

        batch = AssetImportBatch.objects.create(
            user=request.user,
            file=file,
            status='processing',
            started_at=timezone.now(),
            total_rows=len(df)
        )

        success = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                Asset.objects.create(
                    owner=request.user,
                    name=str(row.get('name') or row.get('نام دستگاه', f'دستگاه {idx+1}')),
                    tag_number=str(row.get('tag_number') or row.get('شماره پلاک', f'TAG-{idx+1}')),
                    brand=str(row.get('brand') or row.get('برند', '')),
                    model_number=str(row.get('model_number') or row.get('مدل', '')),
                    location=str(row.get('location') or row.get('موقعیت', '')),
                )
                success += 1
            except Exception as e:
                errors.append({'row': idx + 2, 'error': str(e)})

        batch.status = 'completed' if not errors else 'partial'
        batch.success_count = success
        batch.error_count = len(errors)
        batch.error_log = errors
        batch.completed_at = timezone.now()
        batch.save()

        return Response({
            'batch_id': batch.id,
            'total': batch.total_rows,
            'success': success,
            'errors': len(errors),
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """دانلود فایل نمونه CSV سازگار با Excel"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # هدرها
        writer.writerow([
            'name', 'tag_number', 'brand', 'model_number',
            'serial_number', 'location', 'production_line',
            'criticality', 'purchase_price'
        ])
        
        # داده‌های نمونه
        writer.writerow([
            'پمپ سیرکولاسیون', 'PMP-001', 'KSB', 'Etanorm 100-250',
            'SN12345', 'موتورخانه مرکزی', 'خط A', 'high', '1500000000'
        ])
        writer.writerow([
            'الکتروموتور', 'EM-002', 'Siemens', '1LE1003-1AA42',
            'SN67890', 'خط تولید ۱', '', 'critical', '800000000'
        ])
        
        output.seek(0)
        
        response = HttpResponse(
            '\ufeff' + output.getvalue(),  # BOM برای Excel فارسی
            content_type='text/csv; charset=utf-8'
        )
        response['Content-Disposition'] = 'attachment; filename="asset_import_template.csv"'
        return response
    
    @action(detail=True, methods=['post'])
    def run_prediction(self, request, pk=None):
        """اجرای پیش‌بینی ساده برای یک دارایی"""
        asset = self.get_object()
        
        predictions_created = 0
        
        # بررسی همه سنسورهای فعال
        for sensor in asset.sensors.filter(is_active=True):
            readings = sensor.readings.filter(
                recorded_at__gte=timezone.now() - timedelta(days=30)
            ).order_by('-recorded_at')
            
            if len(readings) < 5:
                continue
            
            values = [r.value for r in readings[:20]]
            
            # بررسی روند ساده (بدون numpy)
            if len(values) >= 2:
                first_half = sum(values[:len(values)//2]) / (len(values)//2)
                second_half = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
                trend = 'up' if second_half > first_half * 1.05 else 'down' if second_half < first_half * 0.95 else 'stable'
                
                # اگر روند صعودی و آستانه بحرانی داره
                if trend == 'up' and sensor.critical_threshold_high:
                    # محاسبه ساده سرعت افزایش
                    if len(values) >= 3:
                        diffs = [values[i+1] - values[i] for i in range(len(values)-1)]
                        avg_increase = sum(diffs) / len(diffs) if diffs else 0
                        
                        if avg_increase > 0 and sensor.critical_threshold_high > values[0]:
                            steps_needed = (sensor.critical_threshold_high - values[0]) / avg_increase
                            days_to_failure = steps_needed / (len(readings) / 30)  # تقریبی
                            
                            if 0 < days_to_failure < 60:  # حداکثر ۶۰ روز
                                predicted_date = timezone.now() + timedelta(days=days_to_failure)
                                
                                # محاسبه اطمینان ساده
                                confidence = min(50 + (len(values) * 2), 90)
                                
                                # جلوگیری از تکراری
                                existing = FailurePrediction.objects.filter(
                                    asset=asset,
                                    sensor=sensor,
                                    status='active'
                                ).exists()
                                
                                if not existing:
                                    FailurePrediction.objects.create(
                                        asset=asset,
                                        title=f'پیش‌بینی خرابی - {sensor.name}',
                                        description=(
                                            f'روند صعودی {sensor.get_sensor_type_display()} تشخیص داده شد. '
                                            f'مقدار فعلی: {sensor.last_reading} {sensor.unit}. '
                                            f'آستانه بحرانی: {sensor.critical_threshold_high} {sensor.unit}. '
                                            f'تخمین زمان رسیدن به آستانه: {days_to_failure:.1f} روز'
                                        ),
                                        predicted_failure_date=predicted_date,
                                        confidence=confidence,
                                        recommended_action=f'بررسی و سرویس {sensor.name}'
                                    )
                                    predictions_created += 1
        
        # به‌روزرسانی سلامت
        asset.health_index = asset.calculate_health_index()
        asset.save()
        
        return Response({
            'message': f'تحلیل انجام شد. {predictions_created} پیش‌بینی جدید ایجاد شد.',
            'predictions_created': predictions_created,
            'new_health_index': asset.health_index
        })    


class AssetPartViewSet(viewsets.ModelViewSet):
    serializer_class = AssetPartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return AssetPart.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )

    def perform_create(self, serializer):
        asset_pk = self.kwargs.get('asset_pk')
        asset = Asset.objects.get(id=asset_pk, owner=self.request.user)
        serializer.save(asset=asset)


class AssetDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = AssetDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return AssetDocument.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )

    def perform_create(self, serializer):
        asset_pk = self.kwargs.get('asset_pk')
        asset = Asset.objects.get(id=asset_pk, owner=self.request.user)
        serializer.save(asset=asset, uploaded_by=self.request.user)


class AssetMaintenanceLogViewSet(viewsets.ModelViewSet):
    serializer_class = AssetMaintenanceLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return AssetMaintenanceLog.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )

    def perform_create(self, serializer):
        asset_pk = self.kwargs.get('asset_pk')
        asset = Asset.objects.get(id=asset_pk, owner=self.request.user)
        log = serializer.save(asset=asset)
        asset.last_maintenance_date = log.completed_at or timezone.now()
        asset.save()


class AssetAlertViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AssetAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AssetAlert.objects.filter(asset__owner=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({'status': 'marked as read'})


class DigitalTwinHotspotViewSet(viewsets.ModelViewSet):
    serializer_class = DigitalTwinHotspotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return DigitalTwinHotspot.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )

    def perform_create(self, serializer):
        asset_pk = self.kwargs.get('asset_pk')
        asset = Asset.objects.get(id=asset_pk, owner=self.request.user)
        serializer.save(asset=asset)
        
        
class SensorViewSet(viewsets.ModelViewSet):
    """مدیریت سنسورهای متصل به دارایی"""
    serializer_class = SensorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return Sensor.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )
    
    def perform_create(self, serializer):
        asset = Asset.objects.get(id=self.kwargs['asset_pk'], owner=self.request.user)
        serializer.save(asset=asset)
    
    @action(detail=True, methods=['post'])
    def record_reading(self, request, asset_pk=None, pk=None):
        """ثبت قرائت جدید برای سنسور"""
        sensor = self.get_object()
        
        value = request.data.get('value')
        if value is None:
            return Response({'error': 'مقدار value الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        
        # تعیین وضعیت
        reading_status = 'normal'
        if sensor.critical_threshold_high and float(value) >= sensor.critical_threshold_high:
            reading_status = 'critical'
        elif sensor.critical_threshold_low and float(value) <= sensor.critical_threshold_low:
            reading_status = 'critical'
        elif sensor.warning_threshold_high and float(value) >= sensor.warning_threshold_high:
            reading_status = 'warning'
        elif sensor.warning_threshold_low and float(value) <= sensor.warning_threshold_low:
            reading_status = 'warning'
        
        reading = SensorReading.objects.create(
            sensor=sensor,
            value=value,
            unit=sensor.unit,
            status=reading_status,
            recorded_at=request.data.get('recorded_at', timezone.now())
        )
        
        # به‌روزرسانی آخرین قرائت سنسور
        sensor.last_reading = value
        sensor.last_reading_at = reading.recorded_at
        sensor.save()
        
        # اگر بحرانی بود، هشدار ایجاد کن
        if reading_status == 'critical':
            AssetAlert.objects.create(
                asset=sensor.asset,
                alert_type='performance_drop',
                severity='critical',
                title=f'قرائت بحرانی سنسور {sensor.name}',
                message=f'مقدار {value} {sensor.unit} از آستانه بحرانی عبور کرد',
                recommended_action=f'بررسی فوری {sensor.asset.name}'
            )
        
        return Response(SensorReadingSerializer(reading).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def readings(self, request, asset_pk=None, pk=None):
        """دریافت تاریخچه قرائت‌های سنسور"""
        sensor = self.get_object()
        hours = int(request.query_params.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        
        readings = sensor.readings.filter(recorded_at__gte=since)
        
        # آماده‌سازی برای نمودار
        chart_data = [
            {
                'time': r.recorded_at.isoformat(),
                'value': r.value,
                'status': r.status
            }
            for r in readings
        ]
        
        return Response({
            'sensor': SensorSerializer(sensor).data,
            'readings_count': readings.count(),
            'chart_data': chart_data,
            'stats': {
                'min': readings.aggregate(min=models.Min('value'))['min'],
                'max': readings.aggregate(max=models.Max('value'))['max'],
                'avg': readings.aggregate(avg=models.Avg('value'))['avg'],
            }
        })


class HotspotViewSet(viewsets.ModelViewSet):
    """مدیریت نقاط حساس"""
    serializer_class = HotspotSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return Hotspot.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )
    
    def perform_create(self, serializer):
        asset = Asset.objects.get(id=self.kwargs['asset_pk'], owner=self.request.user)
        serializer.save(asset=asset)


class MaintenanceScheduleViewSet(viewsets.ModelViewSet):
    """مدیریت برنامه‌های نگهداری"""
    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return MaintenanceSchedule.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )
    
    def perform_create(self, serializer):
        asset = Asset.objects.get(id=self.kwargs['asset_pk'], owner=self.request.user)
        schedule = serializer.save(asset=asset)
        schedule.next_due_at = schedule.calculate_next_due()
        schedule.save()
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, asset_pk=None, pk=None):
        """علامت‌گذاری به عنوان انجام شده"""
        schedule = self.get_object()
        schedule.last_performed_at = timezone.now()
        schedule.next_due_at = schedule.calculate_next_due()
        schedule.save()
        return Response({'message': 'انجام شد', 'next_due': schedule.next_due_at})


class FailurePredictionViewSet(viewsets.ModelViewSet):
    """مشاهده و مدیریت پیش‌بینی‌های خرابی"""
    serializer_class = FailurePredictionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        asset_pk = self.kwargs.get('asset_pk')
        return FailurePrediction.objects.filter(
            asset__owner=self.request.user,
            asset_id=asset_pk
        )
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, asset_pk=None, pk=None):
        """رفع پیش‌بینی"""
        prediction = self.get_object()
        prediction.status = 'resolved'
        prediction.resolved_at = timezone.now()
        prediction.save()
        return Response({'message': 'پیش‌بینی رفع شد'})