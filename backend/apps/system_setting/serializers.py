"""apps/system_setting/serializers.py"""
from rest_framework import serializers
from .models import SystemSetting


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SystemSetting
        fields = ["id", "key", "value", "title", "setting_type", "is_public",
                  "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SystemSettingPublicSerializer(serializers.ModelSerializer):
    """سریالایزر عمومی — فقط key و value."""
    class Meta:
        model  = SystemSetting
        fields = ["key", "value", "title"]


class SystemSettingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SystemSetting
        fields = ["key", "value", "title", "setting_type", "is_public"]

    def validate_key(self, value):
        return value.upper().replace(" ", "_")


class SystemSettingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SystemSetting
        fields = ["value", "title", "setting_type", "is_public"]
