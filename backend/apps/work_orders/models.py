import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class WorkOrder(TimeStampedModel):
    """Execution record for an accepted service scope; commercial Order remains separate."""
    class Status(models.TextChoices):
        READY = 'ready', _('آماده شروع')
        SCHEDULED = 'scheduled', _('زمان‌بندی‌شده')
        IN_PROGRESS = 'in_progress', _('در حال اجرا')
        BLOCKED = 'blocked', _('متوقف')
        SUBMITTED = 'submitted', _('ارسال برای تأیید')
        REWORK = 'rework', _('نیازمند اصلاح')
        ACCEPTED = 'accepted', _('پذیرفته‌شده')
        CANCELLED = 'cancelled', _('لغوشده')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_request = models.OneToOneField('services.ServiceRequest', on_delete=models.PROTECT, related_name='work_order')
    commercial_order = models.ForeignKey('orders.Order', on_delete=models.PROTECT, null=True, blank=True, related_name='work_orders')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='customer_work_orders')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='provider_work_orders')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.READY)
    scope_snapshot = models.JSONField(default=dict)
    scheduled_start = models.DateTimeField(null=True, blank=True)
    scheduled_end = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    blocked_reason = models.TextField(blank=True)
    completion_report = models.TextField(blank=True)
    acceptance_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['customer', 'status']), models.Index(fields=['provider', 'status'])]

    def save(self, *args, **kwargs):
        if not self.scope_snapshot and self.service_request_id:
            request = self.service_request
            quote = request.quotes.filter(is_selected=True).order_by('-created_at').first()
            self.scope_snapshot = {
                'title': request.title, 'description': request.description,
                'quoted_price': str(request.final_price or request.quoted_price or (quote.quoted_price if quote else '')),
                'accepted_at': request.accepted_at.isoformat() if request.accepted_at else None,
                'selected_quote_id': str(quote.pk) if quote else None,
                'provider_notes': quote.provider_notes if quote else request.provider_notes,
                'estimated_completion_date': quote.estimated_completion_date.isoformat() if quote and quote.estimated_completion_date else None,
            }
        super().save(*args, **kwargs)

    def transition(self, target, *, actor, **fields):
        allowed = {
            self.Status.READY: {self.Status.SCHEDULED, self.Status.IN_PROGRESS, self.Status.CANCELLED},
            self.Status.SCHEDULED: {self.Status.IN_PROGRESS, self.Status.CANCELLED},
            self.Status.IN_PROGRESS: {self.Status.BLOCKED, self.Status.SUBMITTED, self.Status.CANCELLED},
            self.Status.BLOCKED: {self.Status.IN_PROGRESS, self.Status.CANCELLED},
            self.Status.SUBMITTED: {self.Status.ACCEPTED, self.Status.REWORK},
            self.Status.REWORK: {self.Status.IN_PROGRESS, self.Status.SUBMITTED},
        }
        if target not in allowed.get(self.status, set()):
            raise ValueError(f'Invalid work order transition: {self.status} -> {target}')
        if target == self.Status.ACCEPTED and actor != self.customer:
            raise PermissionError('Only the customer may accept completed work.')
        self.status = target
        if target == self.Status.IN_PROGRESS and not self.started_at:
            self.started_at = timezone.now()
        if target == self.Status.SUBMITTED:
            self.submitted_at = timezone.now()
        if target == self.Status.ACCEPTED:
            self.accepted_at = timezone.now()
        for key, value in fields.items():
            setattr(self, key, value)
        self.save()


class WorkTask(TimeStampedModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=[('pending','در انتظار'),('in_progress','در حال اجرا'),('blocked','متوقف'),('done','انجام‌شده')], default='pending')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)


class WorkLog(TimeStampedModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='logs')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    event = models.CharField(max_length=40)
    note = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)


class WorkEvidence(TimeStampedModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='evidence')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='work_evidence')
    file = models.FileField(upload_to='work_orders/evidence/')
    description = models.CharField(max_length=250, blank=True)
