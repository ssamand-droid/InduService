"""
apps/support/models.py
تیکت پشتیبانی + پیام + اختلاف
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class TicketStatus(models.TextChoices):
    OPEN      = "open",      "باز"
    IN_REVIEW = "in_review", "در بررسی"
    RESOLVED  = "resolved",  "حل شده"
    CLOSED    = "closed",    "بسته شده"


class TicketPriority(models.TextChoices):
    LOW    = "low",    "پایین"
    MEDIUM = "medium", "متوسط"
    HIGH   = "high",   "بالا"
    URGENT = "urgent", "فوری"


class TicketCategory(models.TextChoices):
    TECHNICAL = "technical", "فنی"
    PAYMENT   = "payment",   "مالی و پرداخت"
    ORDER     = "order",     "سفارش"
    ACCOUNT   = "account",   "حساب کاربری"
    OTHER     = "other",     "سایر"


class Ticket(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name="tickets", verbose_name="کاربر")
    subject     = models.CharField(max_length=300, verbose_name="موضوع")
    body        = models.TextField(verbose_name="متن اولیه")
    status      = models.CharField(max_length=15, choices=TicketStatus.choices,
                                   default=TicketStatus.OPEN, verbose_name="وضعیت")
    priority    = models.CharField(max_length=10, choices=TicketPriority.choices,
                                   default=TicketPriority.MEDIUM, verbose_name="اولویت")
    category    = models.CharField(max_length=20, choices=TicketCategory.choices,
                                   default=TicketCategory.OTHER, verbose_name="دسته‌بندی")
    order       = models.ForeignKey("orders.Order", null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="tickets",
                                    verbose_name="سفارش مرتبط")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="assigned_tickets",
                                    verbose_name="اختصاص به")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "تیکت"
        verbose_name_plural = "تیکت‌ها"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"#{str(self.id)[:8]} — {self.subject}"

    @property
    def messages_count(self):
        return self.messages.count()

    @property
    def user_phone(self):
        return str(getattr(self.user, "phone_number", self.user.username or ""))

    @property
    def user_name(self):
        return self.user.get_full_name() or str(getattr(self.user, "phone_number", ""))

    @property
    def assigned_to_name(self):
        if self.assigned_to:
            return self.assigned_to.get_full_name() or str(self.assigned_to)
        return None

    def close(self):
        self.status = TicketStatus.CLOSED
        self.save(update_fields=["status", "updated_at"])


class TicketMessage(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket     = models.ForeignKey(Ticket, on_delete=models.CASCADE,
                                   related_name="messages", verbose_name="تیکت")
    sender     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   verbose_name="فرستنده")
    body       = models.TextField(verbose_name="متن پیام")
    attachment = models.FileField(upload_to="support/attachments/%Y/%m/",
                                  null=True, blank=True, verbose_name="پیوست")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "پیام تیکت"
        verbose_name_plural = "پیام‌های تیکت"
        ordering            = ["created_at"]

    def __str__(self):
        return f"پیام در {self.ticket} از {self.sender}"


class DisputeResolution(models.TextChoices):
    PENDING     = "pending",     "در انتظار"
    TO_PROVIDER = "to_provider", "پرداخت به متخصص"
    TO_BUYER    = "to_buyer",    "بازگشت به خریدار"
    PARTIAL     = "partial",     "تقسیم"


class Dispute(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order       = models.OneToOneField(
        "orders.Order", 
        on_delete=models.PROTECT,
        related_name="dispute", 
        verbose_name="سفارش",
        null=True,
        blank=True  
    )
    raised_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    verbose_name="ثبت‌کننده اختلاف")
    reason      = models.TextField(verbose_name="دلیل اختلاف")
    resolution  = models.CharField(max_length=15, choices=DisputeResolution.choices,
                                   default=DisputeResolution.PENDING, verbose_name="نتیجه")
    admin_note  = models.TextField(blank=True, verbose_name="یادداشت ادمین")
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ حل")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name        = "اختلاف"
        verbose_name_plural = "اختلافات"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"اختلاف در {self.order}"

    def resolve(self, resolution: str, note: str = ""):
        self.resolution = resolution
        self.admin_note = note
        self.resolved_at = timezone.now()
        self.save(update_fields=["resolution", "admin_note", "resolved_at", "updated_at"])
