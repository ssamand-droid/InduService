import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class Organization(TimeStampedModel):
    """A legal business tenant. People access it through memberships."""

    class Type(models.TextChoices):
        FACTORY = 'factory', _('کارخانه / دریافت‌کننده خدمات')
        SERVICE_PROVIDER = 'service_provider', _('شرکت خدمات‌دهنده')
        SUPPLIER = 'supplier', _('تأمین‌کننده')
        OTHER = 'other', _('سازمان دیگر')

    class VerificationStatus(models.TextChoices):
        UNVERIFIED = 'unverified', _('تأیید نشده')
        PENDING = 'pending', _('در انتظار بررسی')
        VERIFIED = 'verified', _('تأیید شده')
        REJECTED = 'rejected', _('رد شده')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('نام ثبتی سازمان'), max_length=200)
    organization_type = models.CharField(_('نوع سازمان'), max_length=24, choices=Type.choices)
    registration_number = models.CharField(_('شماره ثبت'), max_length=50, blank=True)
    tax_id = models.CharField(_('شناسه ملی / اقتصادی'), max_length=50, blank=True)
    website = models.URLField(_('وب‌سایت'), blank=True)
    address = models.TextField(_('نشانی'), blank=True)
    city = models.CharField(_('شهر'), max_length=100, blank=True)
    province = models.CharField(_('استان'), max_length=100, blank=True)
    postal_code = models.CharField(_('کد پستی'), max_length=20, blank=True)
    verification_status = models.CharField(
        _('وضعیت احراز سازمان'), max_length=20,
        choices=VerificationStatus.choices, default=VerificationStatus.UNVERIFIED,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='created_organizations', verbose_name=_('ایجادکننده'),
    )

    class Meta:
        verbose_name = _('سازمان')
        verbose_name_plural = _('سازمان‌ها')
        ordering = ['name']
        indexes = [models.Index(fields=['organization_type', 'verification_status'], name='org_type_verify_idx')]

    def __str__(self):
        return self.name


class OrganizationMembership(TimeStampedModel):
    """A person's role and authority within one organization."""

    class Role(models.TextChoices):
        OWNER = 'owner', _('مالک')
        ADMIN = 'admin', _('مدیر سازمان')
        REQUESTER = 'requester', _('درخواست‌کننده خدمات')
        APPROVER = 'approver', _('تأییدکننده')
        MEMBER = 'member', _('عضو')
        VIEWER = 'viewer', _('مشاهده‌گر')

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='memberships', verbose_name=_('سازمان'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organization_memberships',
        verbose_name=_('کاربر'),
    )
    role = models.CharField(_('نقش در سازمان'), max_length=16, choices=Role.choices, default=Role.MEMBER)
    is_active = models.BooleanField(_('عضویت فعال'), default=True)

    class Meta:
        verbose_name = _('عضویت سازمانی')
        verbose_name_plural = _('عضویت‌های سازمانی')
        constraints = [models.UniqueConstraint(fields=['organization', 'user'], name='uniq_org_membership_user')]
        indexes = [models.Index(fields=['user', 'is_active', 'role'], name='org_user_active_role_idx')]

    def __str__(self):
        return f'{self.user} — {self.organization} ({self.get_role_display()})'

    @property
    def can_manage(self):
        return self.is_active and self.role in {self.Role.OWNER, self.Role.ADMIN}

    @property
    def can_request(self):
        return self.is_active and self.role in {
            self.Role.OWNER, self.Role.ADMIN, self.Role.REQUESTER, self.Role.MEMBER,
        }

    @property
    def can_approve(self):
        return self.is_active and self.role in {
            self.Role.OWNER, self.Role.ADMIN, self.Role.APPROVER,
        }
