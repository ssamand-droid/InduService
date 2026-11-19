from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WorkOrder, WorkTask, WorkLog, WorkEvidence
from .serializers import WorkOrderSerializer, WorkTaskSerializer, WorkEvidenceSerializer


class WorkOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WorkOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = WorkOrder.objects.select_related('customer', 'provider', 'service_request').prefetch_related('tasks', 'logs')
        if user.is_staff:
            return qs
        return qs.filter(customer=user) | qs.filter(provider=user)

    @action(detail=False, methods=['post'], url_path='from-request/(?P<request_id>[^/.]+)')
    def create_from_request(self, request, request_id=None):
        from services.models import ServiceRequest
        try:
            sr = ServiceRequest.objects.select_related('service').get(pk=request_id)
        except ServiceRequest.DoesNotExist:
            return Response({'detail': 'درخواست پیدا نشد.'}, status=404)
        if sr.buyer_id != request.user.id and not request.user.is_staff:
            raise PermissionDenied()
        if sr.status != ServiceRequest.Status.ACCEPTED:
            raise ValidationError({'detail': 'فقط درخواست پذیرفته‌شده می‌تواند به دستورکار تبدیل شود.'})
        selected_quote = sr.quotes.filter(is_selected=True).select_related('provider').first()
        provider = selected_quote.provider if selected_quote else (sr.service.provider if sr.service_id else None)
        if not provider:
            raise ValidationError({'detail': 'برای این درخواست ارائه‌دهنده مشخص نشده است.'})
        wo, created = WorkOrder.objects.get_or_create(
            service_request=sr,
            defaults={'customer': sr.buyer, 'provider': provider, 'commercial_order': sr.order},
        )
        return Response(self.get_serializer(wo).data, status=201 if created else 200)

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        wo = self.get_object()
        target = request.data.get('status')
        provider_actions = {WorkOrder.Status.SCHEDULED, WorkOrder.Status.IN_PROGRESS, WorkOrder.Status.BLOCKED,
                            WorkOrder.Status.SUBMITTED, WorkOrder.Status.CANCELLED}
        if not request.user.is_staff:
            if request.user == wo.provider and target not in provider_actions:
                raise PermissionDenied()
            if request.user == wo.customer and target not in {WorkOrder.Status.ACCEPTED, WorkOrder.Status.REWORK, WorkOrder.Status.CANCELLED}:
                raise PermissionDenied()
        if target == WorkOrder.Status.SUBMITTED and not request.data.get('completion_report', wo.completion_report).strip():
            raise ValidationError({'completion_report': 'گزارش تکمیل برای ارسال به تأیید الزامی است.'})
        if target == WorkOrder.Status.BLOCKED and not request.data.get('blocked_reason', wo.blocked_reason).strip():
            raise ValidationError({'blocked_reason': 'برای توقف دستورکار، علت را ثبت کنید.'})
        try:
            wo.transition(target, actor=request.user, **{k: v for k, v in request.data.items() if k in {'scheduled_start','scheduled_end','blocked_reason','completion_report','acceptance_notes'}})
        except (ValueError, PermissionError) as exc:
            raise ValidationError({'detail': str(exc)})
        WorkLog.objects.create(work_order=wo, actor=request.user, event=target, note=request.data.get('note', ''))
        return Response(self.get_serializer(wo).data)

    @action(detail=True, methods=['post'])
    def tasks(self, request, pk=None):
        wo = self.get_object()
        if request.user not in (wo.provider, wo.customer) and not request.user.is_staff:
            raise PermissionDenied()
        serializer = WorkTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(work_order=wo)
        WorkLog.objects.create(work_order=wo, actor=request.user, event='task_added', note=task.title)
        return Response(WorkTaskSerializer(task).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='tasks/(?P<task_id>[^/.]+)')
    def update_task(self, request, pk=None, task_id=None):
        wo = self.get_object()
        if request.user not in (wo.provider, wo.customer) and not request.user.is_staff:
            raise PermissionDenied()
        try:
            task = wo.tasks.get(pk=task_id)
        except WorkTask.DoesNotExist:
            return Response({'detail': 'وظیفه پیدا نشد.'}, status=404)
        serializer = WorkTaskSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(completed_at=timezone.now() if serializer.validated_data.get('status') == 'done' else None)
        WorkLog.objects.create(work_order=wo, actor=request.user, event='task_updated', note=task.title, metadata={'status': task.status})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def evidence(self, request, pk=None):
        wo = self.get_object()
        if request.user not in (wo.provider, wo.customer) and not request.user.is_staff:
            raise PermissionDenied()
        serializer = WorkEvidenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save(work_order=wo, uploaded_by=request.user)
        WorkLog.objects.create(work_order=wo, actor=request.user, event='evidence_added', note=evidence.description)
        return Response(WorkEvidenceSerializer(evidence).data, status=201)
