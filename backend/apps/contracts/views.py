from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from contracts.models import ServiceContract, EquipmentTransfer, ContractMilestone
from .serializers import (
    ServiceContractSerializer, EquipmentTransferSerializer,
    ContractMilestoneSerializer, SignContractSerializer
)
from core.permissions import IsBuyer, IsSeller

class ServiceContractViewSet(viewsets.ModelViewSet):
    queryset = ServiceContract.objects.all()
    serializer_class = ServiceContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return self.queryset
        return self.queryset.filter(models.Q(buyer=user) | models.Q(seller=user))

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """امضای قرارداد توسط کاربر جاری"""
        contract = self.get_object()
        user = request.user

        if user == contract.buyer:
            if contract.buyer_signed:
                return Response({'error': 'قبلاً امضا شده است'}, status=400)
            contract.buyer_signed = True
            contract.buyer_signed_at = timezone.now()
        elif user == contract.seller:
            if contract.seller_signed:
                return Response({'error': 'قبلاً امضا شده است'}, status=400)
            contract.seller_signed = True
            contract.seller_signed_at = timezone.now()
        else:
            return Response({'error': 'شما طرف قرارداد نیستید'}, status=403)

        contract.save()
        return Response({'message': 'قرارداد با موفقیت امضا شد'})

    @action(detail=True, methods=['post'], permission_classes=[IsSeller])
    def add_milestone(self, request, pk=None):
        contract = self.get_object()
        serializer = ContractMilestoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(contract=contract)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['patch'], url_path='milestones/(?P<milestone_id>[^/.]+)')
    def update_milestone(self, request, pk=None, milestone_id=None):
        contract = self.get_object()
        try:
            milestone = contract.milestones.get(id=milestone_id)
        except ContractMilestone.DoesNotExist:
            return Response({'error': 'مرحله یافت نشد'}, status=404)
        serializer = ContractMilestoneSerializer(milestone, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class EquipmentTransferViewSet(viewsets.ModelViewSet):
    queryset = EquipmentTransfer.objects.all()
    serializer_class = EquipmentTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(
            models.Q(contract__buyer=user) | models.Q(contract__seller=user)
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """بروزرسانی وضعیت انتقال (توسط فروشنده یا خریدار)"""
        transfer = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(EquipmentTransfer.TransferStatus.choices):
            return Response({'error': 'وضعیت نامعتبر'}, status=400)

        # منطق اعتبارسنجی وضعیت (مثلاً نمی‌توان از PENDING_PICKUP به DELIVERED پرید)
        transfer.status = new_status
        if new_status == EquipmentTransfer.TransferStatus.RECEIVED_BY_SELLER:
            transfer.received_by_seller_date = timezone.now()
        elif new_status == EquipmentTransfer.TransferStatus.READY_FOR_RETURN:
            transfer.repair_completed_date = timezone.now()
        elif new_status == EquipmentTransfer.TransferStatus.DELIVERED_TO_BUYER:
            transfer.delivered_date = timezone.now()
        transfer.save()
        return Response({'message': 'وضعیت بروزرسانی شد'})