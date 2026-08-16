# apps/support/serializers.py
from rest_framework import serializers
from .models import Ticket, TicketMessage, Dispute


class TicketMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ["id", "sender", "body", "attachment", "created_at"]

    def get_sender(self, obj):
        u = obj.sender
        return {
            "id": str(u.id),
            "full_name": u.get_full_name(),
            "phone_number": str(getattr(u, "phone_number", "")),
            "is_staff": u.is_staff,
            "role": getattr(u, "role", "admin" if u.is_staff else "user"),
        }


class TicketMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketMessage
        fields = ["body", "attachment"]


class TicketListSerializer(serializers.ModelSerializer):
    messages_count = serializers.IntegerField(read_only=True)
    user_phone = serializers.CharField(read_only=True)
    user_name = serializers.CharField(read_only=True)
    assigned_to_name = serializers.CharField(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "subject", "status", "priority", "category",
            "user_phone", "user_name", "assigned_to_name",
            "order", "messages_count", "created_at", "updated_at",
        ]


class TicketDetailSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    messages_count = serializers.IntegerField(read_only=True)
    user_phone = serializers.CharField(read_only=True)
    user_name = serializers.CharField(read_only=True)
    assigned_to_name = serializers.CharField(read_only=True)
    
    # ✅ اضافه کردن فیلدهای نمایشی
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", 
            "subject", 
            "body",  # ← این خط مهم است
            "status", 
            "status_display", 
            "priority", 
            "priority_display",
            "category", 
            "category_display", 
            "user_phone", 
            "user_name", 
            "assigned_to_name",
            "order", 
            "messages", 
            "messages_count",
            "created_at", 
            "updated_at",
        ]


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["subject", "body", "priority", "category", "order"]


class TicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["status", "priority", "assigned_to"]


class DisputeSerializer(serializers.ModelSerializer):
    resolution_display = serializers.CharField(source='get_resolution_display', read_only=True)

    class Meta:
        model = Dispute
        fields = [
            "id", "order", "raised_by", "reason", "resolution",
            "resolution_display", "admin_note", "resolved_at", "created_at",
        ]
        read_only_fields = ["id", "raised_by", "resolution", "admin_note", "resolved_at"]


class DisputeResolveSerializer(serializers.Serializer):
    resolution = serializers.ChoiceField(choices=["to_provider", "to_buyer", "partial"])
    note = serializers.CharField(required=False, default="")