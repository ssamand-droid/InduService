from rest_framework import serializers
from .models import ServiceContract, EquipmentTransfer, ContractMilestone

class EquipmentTransferSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = EquipmentTransfer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class ContractMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractMilestone
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class ServiceContractSerializer(serializers.ModelSerializer):
    equipment_transfers = EquipmentTransferSerializer(many=True, read_only=True)
    milestones = ContractMilestoneSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)

    class Meta:
        model = ServiceContract
        fields = '__all__'
        read_only_fields = ['contract_number', 'created_at', 'updated_at', 'buyer_signed', 'seller_signed']

class SignContractSerializer(serializers.Serializer):
    """برای امضای دیجیتال قرارداد"""
    pass  # در عمل باید مکانیزم امضا پیاده‌سازی شود