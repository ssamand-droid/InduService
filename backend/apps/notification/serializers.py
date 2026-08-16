from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'link', 'is_read', 'read_at', 'created_at', 'extra_data']
        read_only_fields = ['id', 'created_at', 'read_at']

class MarkReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(child=serializers.IntegerField())