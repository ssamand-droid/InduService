from rest_framework import serializers
from .models import WorkOrder, WorkTask, WorkLog, WorkEvidence


class WorkTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkTask
        fields = '__all__'
        read_only_fields = ('work_order', 'completed_at')


class WorkLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkLog
        fields = '__all__'
        read_only_fields = ('actor', 'work_order')

class WorkEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkEvidence
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'work_order')


class WorkOrderSerializer(serializers.ModelSerializer):
    tasks = WorkTaskSerializer(many=True, read_only=True)
    logs = WorkLogSerializer(many=True, read_only=True)
    evidence = WorkEvidenceSerializer(many=True, read_only=True)

    class Meta:
        model = WorkOrder
        fields = '__all__'
        read_only_fields = ('customer', 'provider', 'scope_snapshot', 'status', 'started_at', 'submitted_at', 'accepted_at')
