from rest_framework import serializers
from .models import (
    AssetCategory, Asset, AssetPart, AssetDocument,
    AssetHealthLog, AssetMaintenanceLog, AssetAlert,
    DigitalTwinHotspot, AssetImportBatch, MaintenanceImportBatch,
    Sensor, SensorReading, Hotspot, MaintenanceSchedule, FailurePrediction
)
from django.contrib.auth import get_user_model

User = get_user_model()


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'


class AssetPartSerializer(serializers.ModelSerializer):
    asset = serializers.PrimaryKeyRelatedField(read_only=True)
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = AssetPart
        fields = '__all__'
        read_only_fields = ['asset']

    def get_stock_status(self, obj):
        if obj.stock_quantity == 0:
            return 'out_of_stock'
        elif obj.stock_quantity <= obj.min_stock_alert:
            return 'low_stock'
        return 'in_stock'


class DigitalTwinHotspotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DigitalTwinHotspot
        fields = '__all__'


class AssetDocumentSerializer(serializers.ModelSerializer):
    asset = serializers.PrimaryKeyRelatedField(read_only=True)
    uploaded_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AssetDocument
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'upload_date', 'asset']


class AssetHealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetHealthLog
        fields = '__all__'
        read_only_fields = ['recorded_by']


class AssetMaintenanceLogSerializer(serializers.ModelSerializer):
    total_cost = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    replaced_parts = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AssetPart.objects.all(),
        required=False
    )
    asset = serializers.PrimaryKeyRelatedField(read_only=True)  # 🆕 از URL میاد

    class Meta:
        model = AssetMaintenanceLog
        fields = '__all__'
        read_only_fields = ['created_at', 'asset']  # 🆕 asset فقط خواندنی

class AssetAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'resolved_at']


class AssetListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    alert_count = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id', 'name', 'tag_number', 'category_name', 'status',
            'criticality', 'health_index', 'location', 'main_image',
            'alert_count', 'next_maintenance_date', 'updated_at'
        ]

    def get_alert_count(self, obj):
        return obj.alerts.filter(is_read=False).count()


class AssetDetailSerializer(serializers.ModelSerializer):
    category = AssetCategorySerializer(read_only=True)
    parts = AssetPartSerializer(many=True, read_only=True)
    hotspots = DigitalTwinHotspotSerializer(many=True, read_only=True)
    recent_alerts = serializers.SerializerMethodField()
    recent_maintenance = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ['owner', 'health_index', 'created_at', 'updated_at']

    def get_recent_alerts(self, obj):
        alerts = obj.alerts.filter(is_read=False)[:5]
        return AssetAlertSerializer(alerts, many=True).data

    def get_recent_maintenance(self, obj):
        logs = obj.maintenance_logs.all()[:3]
        return AssetMaintenanceLogSerializer(logs, many=True).data


class AssetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            'name', 'category', 'tag_number', 'brand', 'model_number',
            'serial_number', 'location', 'production_line', 'criticality',
            'main_image', 'nameplate_image', 'installation_date',
            'purchase_price', 'hourly_downtime_cost'
        ]

    def validate_tag_number(self, value):
        if Asset.objects.filter(tag_number=value).exists():
            raise serializers.ValidationError("این شماره پلاک قبلاً ثبت شده است.")
        return value

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class AssetImportBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetImportBatch
        fields = '__all__'
        read_only_fields = ['user', 'status', 'total_rows', 'success_count',
                           'error_count', 'error_log', 'started_at', 'completed_at']


class SensorSerializer(serializers.ModelSerializer):
    asset = serializers.PrimaryKeyRelatedField(read_only=True)
    last_reading_status = serializers.SerializerMethodField()

    class Meta:
        model = Sensor
        fields = '__all__'
        read_only_fields = ['asset', 'last_reading', 'last_reading_at', 'created_at']

    def get_last_reading_status(self, obj):
        if obj.last_reading is None:
            return 'unknown'
        if obj.critical_threshold_high and obj.last_reading >= obj.critical_threshold_high:
            return 'critical'
        if obj.critical_threshold_low and obj.last_reading <= obj.critical_threshold_low:
            return 'critical'
        if obj.warning_threshold_high and obj.last_reading >= obj.warning_threshold_high:
            return 'warning'
        if obj.warning_threshold_low and obj.last_reading <= obj.warning_threshold_low:
            return 'warning'
        return 'normal'


class SensorReadingSerializer(serializers.ModelSerializer):
    sensor_name = serializers.CharField(source='sensor.name', read_only=True)
    sensor_type = serializers.CharField(source='sensor.sensor_type', read_only=True)

    class Meta:
        model = SensorReading
        fields = '__all__'
        read_only_fields = ['sensor', 'status']


class HotspotSerializer(serializers.ModelSerializer):
    asset = serializers.PrimaryKeyRelatedField(read_only=True)
    part_name = serializers.CharField(source='part.name', read_only=True)
    sensor_live_value = serializers.SerializerMethodField()

    class Meta:
        model = Hotspot
        fields = '__all__'
        read_only_fields = ['asset', 'created_at', 'updated_at']

    def get_sensor_live_value(self, obj):
        if obj.sensor and obj.show_live_data:
            return {
                'value': obj.sensor.last_reading,
                'unit': obj.sensor.unit,
                'status': obj.sensor.last_reading_status if hasattr(obj.sensor, 'last_reading_status') else 'unknown',
                'updated_at': obj.sensor.last_reading_at
            }
        return None


class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    asset = serializers.PrimaryKeyRelatedField(read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceSchedule
        fields = '__all__'
        read_only_fields = ['asset', 'last_performed_at', 'created_at', 'updated_at']

    def get_is_overdue(self, obj):
        if obj.next_due_at:
            return timezone.now() > obj.next_due_at
        return False


class FailurePredictionSerializer(serializers.ModelSerializer):
    asset = serializers.PrimaryKeyRelatedField(read_only=True)
    part_name = serializers.CharField(source='part.name', read_only=True)

    class Meta:
        model = FailurePrediction
        fields = '__all__'
        read_only_fields = ['asset', 'created_at', 'resolved_at']
