# backend/apps/services/views.py

from decimal import Decimal
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models as db_models, transaction
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils.text import slugify
import uuid

from .models import (
    ServiceCategory, Service, ServiceRequest, ServiceRequestAttachment,
    ServiceCompletionImage, ServiceRequestQuote
)
from .serializers import (
    ServiceCategorySerializer, ServiceListSerializer, ServiceDetailSerializer,
    ServiceCreateUpdateSerializer, ServiceRequestSerializer, ServiceRequestUpdateSerializer,
    ServiceRequestAttachmentSerializer, ProviderQuoteSerializer,
    ForceMajeureSerializer, ReviewSerializer,
)
from core.permissions import IsSeller, IsBuyer
from users.models import User
from notification.services import create_notification
from payment.models import Invoice, Wallet, WalletTransaction, Payment, PaymentReceipt


# ============================================================
# ServiceCategoryViewSet
# ============================================================
class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'


# ============================================================
# ServiceViewSet
# ============================================================
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related('provider', 'category')\
                              .prefetch_related('images')\
                              .filter(is_active=True, is_deleted=False)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'category__slug': ['exact'],
        'service_type': ['exact'],
        'pricing_model': ['exact'],
        'is_remote': ['exact'],
        'is_onsite': ['exact'],
        'service_scenario': ['exact'],
    }
    search_fields = ['title', 'description', 'provider__first_name', 'provider__last_name']
    ordering_fields = ['base_price', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ServiceCreateUpdateSerializer
        return ServiceDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsSeller | permissions.IsAdminUser]
        return super().get_permissions()

    def perform_create(self, serializer):
        title = self.request.data.get('title', '')
        unique_slug = f"{slugify(title, allow_unicode=True)}-{uuid.uuid4().hex[:6]}"
        serializer.save(provider=self.request.user, slug=unique_slug)

    @action(detail=False, methods=['get'])
    def my_services(self, request):
        services = self.get_queryset().filter(provider=request.user)
        page = self.paginate_queryset(services)
        if page is not None:
            serializer = ServiceListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ServiceListSerializer(services, many=True, context={'request': request})
        return Response(serializer.data)


# ============================================================
# ServiceMatchView
# ============================================================
class ServiceMatchView(APIView):
    """پیدا کردن سرویس مرتبط با درخواست بر اساس کلمات کلیدی"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        equipment_details = request.data.get('equipment_details', '')

        search_text = f"{title} {description} {equipment_details}".lower()

        matching_services = Service.objects.filter(
            Q(title__icontains=search_text) |
            Q(description__icontains=search_text),
            is_active=True,
            is_deleted=False
        ).distinct()[:3]

        if matching_services:
            best_match = matching_services[0]
            return Response({
                'service_id': best_match.id,
                'service_title': best_match.title,
                'confidence': 85
            })

        return Response({'service_id': None, 'confidence': 0})


# ============================================================
# ServiceRequestViewSet
# ============================================================
class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.select_related('buyer', 'service').all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return ServiceRequest.objects.none()

        if user.role == 'admin' or user.is_staff:
            return ServiceRequest.objects.select_related('buyer', 'service__provider').all().order_by('-created_at')

        if user.role in ['seller', 'service_provider', 'company_seller', 'company_provider']:
            from notification.models import Notification

            direct_requests = ServiceRequest.objects.filter(service__provider=user)

            notified_request_ids = (
                Notification.objects.filter(
                    user=user,
                    type='service_request',
                    extra_data__has_key='request_id',
                )
                .annotate(
                    request_id_text=db_models.functions.Cast(
                        db_models.expressions.RawSQL(
                            "extra_data->>'request_id'",
                            (),
                            output_field=db_models.TextField(),
                        ),
                        db_models.TextField(),
                    )
                )
                .values_list('request_id_text', flat=True)
                .distinct()
            )

            notified_requests = (
                ServiceRequest.objects.annotate(
                    request_id_text=db_models.functions.Cast(
                        'id',
                        db_models.TextField(),
                    )
                )
                .filter(
                    request_id_text__in=notified_request_ids,
                    status__in=['pending', 'reviewed', 'quoted'],
                )
                .exclude(buyer=user)
            )

            selected_quote_requests = ServiceRequest.objects.filter(
                quotes__provider=user,
                quotes__is_selected=True,
                status__in=[
                    'accepted', 'in_progress', 'submitted_for_acceptance', 'completed'
                ]
            )

            return (
                direct_requests | notified_requests | selected_quote_requests
            ).select_related(
                'buyer', 'service__provider'
            ).prefetch_related('quotes', 'quotes__provider').order_by('-created_at').distinct()

        if user.role in ['buyer', 'technician', 'maintenance_manager', 'procurement']:
            return ServiceRequest.objects.filter(
                Q(buyer=user, organization__isnull=True)
                | Q(organization__memberships__user=user, organization__memberships__is_active=True)
            ).select_related('service__provider').prefetch_related('quotes', 'quotes__provider').order_by('-created_at')

        return ServiceRequest.objects.none()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        if user.role == 'admin' or user.is_staff:
            return obj

        if user.role in ['buyer', 'technician', 'maintenance_manager', 'procurement'] and obj.can_be_viewed_by(user):
            return obj

        if user.role in ['seller', 'service_provider', 'company_seller', 'company_provider']:
            if obj.status in ['accepted', 'in_progress', 'submitted_for_acceptance', 'completed']:
                if ServiceRequestQuote.objects.filter(
                    service_request=obj, provider=user, is_selected=True
                ).exists():
                    return obj

            if obj.service and obj.service.provider == user:
                return obj

            from notification.models import Notification
            has_notification = Notification.objects.filter(
                user=user, type='service_request', extra_data__request_id=obj.id
            ).exists()

            if has_notification and obj.status in ['pending', 'reviewed', 'quoted']:
                return obj

        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("شما دسترسی به این درخواست ندارید")

    # ---------- match_providers ----------
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def match_providers(self, request, pk=None):
        service_request = self.get_object()

        if not service_request.can_be_requested_by(request.user):
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        matching_enabled = service_request.extra_data.get('matching_enabled', True)
        if not matching_enabled and not request.user.is_staff:
            return Response({
                'success': False,
                'message': 'Matching Engine برای این درخواست غیرفعال است',
                'matching_enabled': False,
            }, status=403)

        try:
            from .matching_engine import MatchingEngine
            cached = service_request.extra_data.get('matched_providers')
            if cached and not request.query_params.get('refresh'):
                results = cached
            else:
                results = MatchingEngine.find_best_providers(service_request)
                service_request.extra_data['matched_providers'] = results
                service_request.save(update_fields=['extra_data'])

            return Response({
                'success': True,
                'request_id': service_request.id,
                'request_title': service_request.title,
                'matching_enabled': matching_enabled,
                'total_providers_found': len(results),
                'providers': results,
                'cached': bool(cached and not request.query_params.get('refresh')),
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    # ---------- perform_create ----------
    def perform_create(self, serializer):
        from notification.services import find_matching_service, notify_matching_providers
        from assets.models import Asset

        service_id = self.request.data.get('service')
        title = self.request.data.get('title', '')
        description = self.request.data.get('description', '')
        equipment_details = self.request.data.get('equipment_details', '')
        extra_data = self.request.data.get('extra_data', {})
        industry = self.request.data.get('industry', '')
        asset_id = self.request.data.get('related_asset', '')

        asset_name = ''
        if asset_id:
            try:
                asset = Asset.objects.get(id=asset_id)
                asset_name = asset.name
            except Asset.DoesNotExist:
                pass

        matched_service = None
        if service_id:
            try:
                matched_service = Service.objects.get(id=service_id, is_active=True, is_deleted=False)
            except Service.DoesNotExist:
                pass

        if not matched_service:
            matched_service = find_matching_service(
                title, description, equipment_details, extra_data,
                industry=industry, asset_name=asset_name
            )

        organization = serializer.validated_data.get('organization')
        if organization is None:
            from organizations.models import OrganizationMembership
            available = list(OrganizationMembership.objects.filter(
                user=self.request.user, is_active=True, role__in=[
                    OrganizationMembership.Role.OWNER, OrganizationMembership.Role.ADMIN,
                    OrganizationMembership.Role.REQUESTER, OrganizationMembership.Role.MEMBER,
                ], organization__organization_type='factory',
            ).select_related('organization'))
            if len(available) == 1:
                organization = available[0].organization
            elif len(available) > 1:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'organization': 'برای ثبت درخواست، سازمان موردنظر را انتخاب کنید.'})
            elif (
                getattr(self.request.user.profile, 'person_type', None) == 'legal'
                and self.request.user.profile.registration_completed
            ):
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'organization': 'برای ثبت درخواست سازمانی، عضویت فعال با دسترسی درخواست لازم است.'})

        service_request = serializer.save(
            buyer=self.request.user, service=matched_service, organization=organization,
        )

        if not matched_service:
            self.request.session['unmatched_request'] = True
            self.request.session['unmatched_request_id'] = service_request.id
            for admin in User.objects.filter(role='admin'):
                create_notification(
                    user=admin, type='service_request',
                    title='⚠️ درخواست بدون سرویس منطبق',
                    message=f'درخواست جدید "{service_request.title}" بدون سرویس منطبق ثبت شد.',
                    link=f'/dashboard/admin/service-requests/{service_request.id}',
                    extra_data={'request_id': service_request.id, 'needs_manual_review': True}
                )
        else:
            try:
                notify_matching_providers(service_request)
            except Exception:
                pass

        return service_request

    # ============================================================
    # accept_quote — با نرخ کمیسیون قانونی (بدون هاردکد ۱۰٪)
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept_quote(self, request, pk=None):
        service_request = self.get_object()
        quote_id = request.data.get('quote_id')

        if not quote_id:
            return Response({'error': 'شناسه پیشنهاد مشخص نشده'}, status=400)

        if not service_request.can_be_approved_by(request.user):
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        with transaction.atomic():
            service_request = ServiceRequest.objects.select_for_update().get(pk=service_request.pk)

            if service_request.status not in ['reviewed', 'quoted']:
                return Response({'error': 'وضعیت درخواست قابل قبول نیست'}, status=400)

            if ServiceRequestQuote.objects.filter(
                service_request=service_request, is_selected=True
            ).exists():
                return Response({'error': 'برای این درخواست قبلاً یک پیشنهاد انتخاب شده است.'}, status=400)

            try:
                quote = ServiceRequestQuote.objects.select_related('provider').get(
                    id=quote_id, service_request=service_request
                )
            except ServiceRequestQuote.DoesNotExist:
                return Response({'error': 'پیشنهاد یافت نشد'}, status=404)

            total_price = Decimal(str(quote.quoted_price))
            advance = (
                Decimal(str(quote.advance_payment_amount))
                if quote.advance_payment_required and quote.advance_payment_amount
                else Decimal('0')
            )
            if advance < 0 or advance > total_price:
                return Response({'error': 'مبلغ پیش‌پرداخت باید بین صفر و مبلغ کل باشد.'}, status=400)

            invoice = Invoice.build_for_service_request(
                service_request=service_request,
                seller=quote.provider,
                total=total_price,
                advance=advance,
            )
            invoice.save()

            quote.is_selected = True
            quote.save(update_fields=['is_selected', 'updated_at'])

            service_request.quoted_price = total_price
            service_request.final_price = total_price
            service_request.provider_notes = quote.provider_notes
            service_request.advance_payment_required = quote.advance_payment_required
            service_request.advance_payment_amount = advance if advance > 0 else None
            service_request.estimated_completion_date = quote.estimated_completion_date
            service_request.status = ServiceRequest.Status.ACCEPTED
            service_request.save()

        create_notification(
            user=quote.provider, type='service',
            title='✅ پیشنهاد شما انتخاب شد',
            message=f'پیشنهاد شما برای درخواست "{service_request.title}" انتخاب شد.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        for other_quote in ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=False
        ).exclude(provider=quote.provider).select_related('provider'):
            create_notification(
                user=other_quote.provider, type='service',
                title='❌ پیشنهاد شما انتخاب نشد',
                message=f'پیشنهاد شما برای درخواست "{service_request.title}" انتخاب نشد.',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        for admin in User.objects.filter(role='admin'):
            create_notification(
                user=admin, type='service',
                title='💰 قیمت نهایی انتخاب شد',
                message=f'درخواست "{service_request.title}" - قیمت: {total_price:,} ریال - کمیسیون: {invoice.platform_commission_rate}%',
                link=f'/dashboard/admin/service-requests/{service_request.id}'
            )

        if advance > 0:
            create_notification(
                user=service_request.buyer, type='payment',
                title='نیاز به پیش‌پرداخت',
                message=f'پیش‌پرداخت: {advance:,} ریال | مابقی: {total_price - advance:,} ریال',
                link=f'/dashboard/service-requests/{service_request.id}'
            )
            return Response({
                'success': True,
                'message': f'قیمت پذیرفته شد. پیش‌پرداخت {advance:,} ریال را واریز کنید.',
                'invoice_id': invoice.id,
                'commission_rate': float(invoice.platform_commission_rate),
                'advance_payment_required': True,
                'advance_payment_amount': float(advance),
                'remaining_amount': float(total_price - advance),
            })

        return Response({
            'success': True,
            'invoice_id': invoice.id,
            'commission_rate': float(invoice.platform_commission_rate),
            'message': 'قیمت پذیرفته شد. ارائه‌دهنده منتخب می‌تواند کار را شروع کند.'
        })

    # ============================================================
    # pay_advance — ثبت Payment پیش‌پرداخت
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def pay_advance(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_approved_by(request.user):
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if not service_request.advance_payment_required:
            return Response({'error': 'این خدمت نیاز به پیش‌پرداخت ندارد'}, status=400)

        if 'receipt' not in request.FILES:
            return Response({'error': 'رسید پرداخت الزامی است'}, status=400)

        invoice = getattr(service_request, 'invoice', None)
        if not invoice:
            return Response({'error': 'فاکتور وجود ندارد'}, status=400)

        if invoice.payments.filter(
            payment_type=Payment.PaymentType.ADVANCE,
            status__in=[Payment.PaymentStatus.SUBMITTED, Payment.PaymentStatus.VERIFIED]
        ).exists():
            return Response({'error': 'پیش‌پرداخت قبلاً ثبت شده است.'}, status=400)

        advance_amount = Decimal(str(invoice.advance_payment))
        with transaction.atomic():
            payment = Payment.objects.create(
                invoice=invoice,
                payment_type=Payment.PaymentType.ADVANCE,
                amount=advance_amount,
                method=Payment.PaymentMethod.CARD_TO_CARD,
                status=Payment.PaymentStatus.SUBMITTED,
                paid_at=timezone.now(),
                reference_id=request.data.get('reference_id', ''),
            )
            PaymentReceipt.objects.create(payment=payment, image=request.FILES['receipt'])

            invoice.status = invoice.InvoiceStatus.PARTIALLY_PAID
            invoice.save()

            service_request.advance_payment_paid = True
            service_request.save(update_fields=['advance_payment_paid', 'updated_at'])

        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        assigned_provider = (
            selected_quote.provider if selected_quote
            else (service_request.service.provider if service_request.service else None)
        )
        if assigned_provider:
            create_notification(
                user=assigned_provider, type='payment',
                title='پیش‌پرداخت ثبت شد (در انتظار تأیید)',
                message=f'رسید پیش‌پرداخت درخواست "{service_request.title}" ثبت شد.',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        for admin in User.objects.filter(role='admin'):
            create_notification(
                user=admin, type='payment',
                title='📎 رسید پیش‌پرداخت در انتظار تأیید',
                message=f'پرداخت #{payment.id} - {advance_amount:,} ریال',
                link=f'/dashboard/admin/payments/{payment.id}'
            )

        return Response({
            'success': True,
            'payment_id': payment.id,
            'message': 'رسید پیش‌پرداخت ثبت شد. در انتظار تأیید ادمین.'
        })

    # ============================================================
    # start_work
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_work(self, request, pk=None):
        service_request = self.get_object()
        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        assigned_provider = (
            selected_quote.provider if selected_quote
            else (service_request.service.provider if service_request.service else None)
        )

        if request.user != assigned_provider and not request.user.is_staff and request.user.role != 'admin':
            return Response({'error': 'فقط ارائه‌دهنده منتخب می‌تواند کار را شروع کند.'}, status=403)

        if service_request.status != ServiceRequest.Status.ACCEPTED:
            return Response({'error': 'ابتدا باید درخواست پذیرفته شود'}, status=400)

        service_request.status = ServiceRequest.Status.IN_PROGRESS
        service_request.save(update_fields=['status', 'updated_at'])

        return Response({'message': 'شروع فرآیند ثبت شد.'})

    # ============================================================
    # complete — SUBMITTED_FOR_ACCEPTANCE (نه COMPLETED)
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        service_request = self.get_object()
        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        assigned_provider = (
            selected_quote.provider if selected_quote
            else (service_request.service.provider if service_request.service else None)
        )

        if request.user != assigned_provider and not request.user.is_staff and request.user.role != 'admin':
            return Response({'error': 'فقط ارائه‌دهنده منتخب می‌تواند خدمت را تکمیل کند.'}, status=403)

        if service_request.status != ServiceRequest.Status.IN_PROGRESS:
            return Response({'error': 'وضعیت فعلی قابل تکمیل نیست'}, status=400)

        completion_notes = (request.data.get('completion_notes') or '').strip()
        if not completion_notes:
            return Response({'error': 'Completion report is required.'}, status=400)

        service_request.status = ServiceRequest.Status.SUBMITTED_FOR_ACCEPTANCE
        service_request.completion_notes = completion_notes
        service_request.save(update_fields=['status', 'completion_notes', 'updated_at'])

        create_notification(
            user=service_request.buyer, type='service',
            title='🔔 گزارش تکمیل در انتظار تأیید شما',
            message=f'ارائه‌دهنده گزارش تکمیل "{service_request.title}" را ارسال کرد.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        return Response({
            'success': True,
            'message': 'گزارش تکمیل ارسال شد. در انتظار تأیید کارخانه.',
            'status': service_request.status,
        })

    # ============================================================
    # complete_with_images — همان وضعیت
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete_with_images(self, request, pk=None):
        service_request = self.get_object()
        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        assigned_provider = (
            selected_quote.provider if selected_quote
            else (service_request.service.provider if service_request.service else None)
        )

        if request.user != assigned_provider and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if service_request.status != ServiceRequest.Status.IN_PROGRESS:
            return Response({'error': 'خدمت در حال انجام نیست'}, status=400)

        completion_notes = (request.data.get('completion_notes') or '').strip()
        if not completion_notes:
            return Response({'error': 'Completion report is required.'}, status=400)

        saved_images = []
        with transaction.atomic():
            service_request.completion_notes = completion_notes
            service_request.status = ServiceRequest.Status.SUBMITTED_FOR_ACCEPTANCE
            service_request.save(update_fields=['completion_notes', 'status', 'updated_at'])

            for image in request.FILES.getlist('images'):
                img = ServiceCompletionImage.objects.create(service_request=service_request, image=image)
                saved_images.append({
                    'id': img.id,
                    'url': request.build_absolute_uri(img.image.url),
                })

        create_notification(
            user=service_request.buyer, type='service',
            title='🔔 گزارش تکمیل با تصاویر در انتظار تأیید',
            message=f'گزارش تکمیل "{service_request.title}" ارسال شد.',
            link=f'/dashboard/service-requests/{service_request.id}',
            extra_data={'images': saved_images}
        )

        return Response({
            'success': True,
            'message': 'گزارش تکمیل ارسال شد. در انتظار تأیید کارخانه.',
            'images': saved_images,
            'status': service_request.status,
        })

    # ============================================================
    # accept_completion — تأیید نهایی کارخانه
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept_completion(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_approved_by(request.user):
            return Response({'error': 'فقط کارخانه می‌تواند تأیید کند'}, status=403)

        if service_request.status != ServiceRequest.Status.SUBMITTED_FOR_ACCEPTANCE:
            return Response({'error': 'وضعیت فعلی قابل تأیید نیست'}, status=400)

        service_request.status = ServiceRequest.Status.COMPLETED
        service_request.actual_completion_date = timezone.now()
        service_request.accepted_at = timezone.now()
        service_request.rejection_reason = ''
        service_request.save(update_fields=[
            'status', 'actual_completion_date', 'accepted_at', 'rejection_reason', 'updated_at'
        ])

        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        if selected_quote and selected_quote.provider:
            create_notification(
                user=selected_quote.provider, type='service',
                title='✅ کارخانه گزارش تکمیل را تأیید کرد',
                message=f'درخواست "{service_request.title}" نهایی شد.',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        invoice = getattr(service_request, 'invoice', None)
        if invoice and invoice.remaining_amount > 0:
            create_notification(
                user=service_request.buyer, type='payment',
                title='💰 لطفاً پرداخت نهایی را انجام دهید',
                message=f'مبلغ باقی‌مانده: {invoice.remaining_amount:,} ریال',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        return Response({
            'success': True,
            'message': 'گزارش تأیید شد. لطفاً پرداخت نهایی را انجام دهید.',
            'remaining_amount': float(invoice.remaining_amount) if invoice else 0,
        })

    # ============================================================
    # reject_completion
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject_completion(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_approved_by(request.user):
            return Response({'error': 'فقط کارخانه می‌تواند رد کند'}, status=403)

        if service_request.status != ServiceRequest.Status.SUBMITTED_FOR_ACCEPTANCE:
            return Response({'error': 'وضعیت فعلی قابل رد نیست'}, status=400)

        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'error': 'دلیل رد الزامی است'}, status=400)

        service_request.status = ServiceRequest.Status.IN_PROGRESS
        service_request.rejection_reason = reason
        service_request.rejected_at = timezone.now()
        service_request.save(update_fields=['status', 'rejection_reason', 'rejected_at', 'updated_at'])

        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        if selected_quote and selected_quote.provider:
            create_notification(
                user=selected_quote.provider, type='service',
                title='❌ گزارش تکمیل رد شد',
                message=f'دلیل: {reason}\nلطفاً کار را اصلاح و مجدداً ارسال کنید.',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        return Response({'success': True, 'message': 'گزارش رد شد. ارائه‌دهنده باید اصلاح کند.'})

    # ============================================================
    # request_revision
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def request_revision(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_approved_by(request.user):
            return Response({'error': 'فقط کارخانه می‌تواند درخواست اصلاح دهد'}, status=403)

        if service_request.status != ServiceRequest.Status.SUBMITTED_FOR_ACCEPTANCE:
            return Response({'error': 'وضعیت فعلی قابل درخواست اصلاح نیست'}, status=400)

        note = (request.data.get('note') or '').strip()
        if not note:
            return Response({'error': 'متن درخواست اصلاح الزامی است'}, status=400)

        service_request.status = ServiceRequest.Status.IN_PROGRESS
        service_request.rejection_reason = f'درخواست اصلاح: {note}'
        service_request.rejected_at = timezone.now()
        service_request.save(update_fields=['status', 'rejection_reason', 'rejected_at', 'updated_at'])

        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        if selected_quote and selected_quote.provider:
            create_notification(
                user=selected_quote.provider, type='service',
                title='🛠 درخواست اصلاح از کارخانه',
                message=f'جزئیات: {note}',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        return Response({'success': True, 'message': 'درخواست اصلاح ارسال شد.'})

    # ============================================================
    # final_payment — بعد از COMPLETED
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def final_payment(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_approved_by(request.user):
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if service_request.status != ServiceRequest.Status.COMPLETED:
            return Response({'error': 'خدمت هنوز توسط کارخانه تأیید نشده'}, status=400)

        if 'receipt' not in request.FILES:
            return Response({'error': 'رسید الزامی است'}, status=400)

        invoice = getattr(service_request, 'invoice', None)
        if not invoice:
            return Response({'error': 'فاکتوری وجود ندارد'}, status=400)

        if invoice.payments.filter(
            payment_type=Payment.PaymentType.FINAL,
            status__in=[Payment.PaymentStatus.SUBMITTED, Payment.PaymentStatus.VERIFIED]
        ).exists():
            return Response({'error': 'پرداخت نهایی قبلاً ثبت شده است.'}, status=400)

        remaining = Decimal(str(invoice.remaining_amount))
        if remaining <= 0:
            return Response({'error': 'مبلغی برای پرداخت باقی نمانده است.'}, status=400)

        with transaction.atomic():
            payment = Payment.objects.create(
                invoice=invoice,
                payment_type=Payment.PaymentType.FINAL,
                amount=remaining,
                method=Payment.PaymentMethod.CARD_TO_CARD,
                status=Payment.PaymentStatus.SUBMITTED,
                paid_at=timezone.now(),
                reference_id=request.data.get('reference_id', ''),
            )
            PaymentReceipt.objects.create(payment=payment, image=request.FILES['receipt'])

        create_notification(
            user=service_request.buyer, type='payment',
            title='📎 رسید پرداخت نهایی آپلود شد',
            message='رسید شما در انتظار تأیید ادمین است.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        for admin in User.objects.filter(role='admin'):
            create_notification(
                user=admin, type='payment',
                title='📎 پرداخت نهایی در انتظار تأیید',
                message=f'پرداخت #{payment.id} - {remaining:,} ریال',
                link=f'/dashboard/admin/payments/{payment.id}'
            )

        return Response({
            'success': True,
            'payment_id': payment.id,
            'message': 'رسید پرداخت نهایی ثبت شد. در انتظار تأیید ادمین.'
        })

    # ============================================================
    # upload_payment_receipt — سازگاری
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_payment_receipt(self, request, pk=None):
        payment_type = request.data.get('payment_type', 'final')
        if payment_type == 'advance':
            return self.pay_advance(request, pk)
        return self.final_payment(request, pk)

    # ============================================================
    # upload_attachment
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_attachment(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_requested_by(request.user):
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)
        if service_request.status != ServiceRequest.Status.PENDING:
            return Response({'error': 'فقط درخواست‌های در انتظار بررسی قابل ویرایش هستند'}, status=400)
        if 'file' not in request.FILES:
            return Response({'error': 'فایلی آپلود نشده'}, status=400)

        attachment = ServiceRequestAttachment.objects.create(
            service_request=service_request,
            file=request.FILES['file'],
            description=request.data.get('description', '')
        )

        return Response({
            'id': attachment.id,
            'file': request.build_absolute_uri(attachment.file.url),
            'file_url': request.build_absolute_uri(attachment.file.url),
            'description': attachment.description,
            'created_at': attachment.created_at,
        }, status=201)

    # ============================================================
    # update_request
    # ============================================================
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_request(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_requested_by(request.user):
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)
        if service_request.status != ServiceRequest.Status.PENDING:
            return Response({'error': 'فقط درخواست‌های در انتظار بررسی قابل ویرایش هستند'}, status=400)
        allowed_fields = ['title', 'description', 'equipment_details', 'desired_start_date', 'urgency', 'extra_data']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        for field, value in update_data.items():
            setattr(service_request, field, value)
        service_request.save(update_fields=list(update_data.keys()))
        serializer = ServiceRequestSerializer(service_request)
        return Response(serializer.data)

    # ============================================================
    # provider_quote
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def provider_quote(self, request, pk=None):
        from notification.models import Notification

        service_request = self.get_object()
        user = request.user

        already_selected = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).exists()
        if already_selected:
            return Response({'error': 'خریدار قبلاً یک پیشنهاد را انتخاب کرده است.'}, status=400)

        has_notification = Notification.objects.filter(
            user=user, type='service_request', extra_data__request_id=service_request.id
        ).exists()
        is_admin = user.is_staff or user.role == 'admin'
        is_direct_provider = service_request.service and service_request.service.provider == user

        if not (has_notification or is_admin or is_direct_provider):
            return Response({'error': 'دسترسی به اعلام قیمت ندارید'}, status=403)

        if service_request.status not in ['pending', 'reviewed', 'quoted']:
            return Response({'error': 'در این مرحله نمی‌توانید قیمت اعلام کنید'}, status=400)

        serializer = ProviderQuoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quote, created = ServiceRequestQuote.objects.update_or_create(
            service_request=service_request,
            provider=user,
            defaults={
                'quoted_price': serializer.validated_data['quoted_price'],
                'provider_notes': serializer.validated_data.get('provider_notes', ''),
                'estimated_completion_date': serializer.validated_data.get('estimated_completion_date'),
                'advance_payment_required': serializer.validated_data.get('advance_payment_required', False),
                'advance_payment_amount': serializer.validated_data.get('advance_payment_amount'),
            }
        )

        if service_request.status in ['pending', 'reviewed']:
            service_request.status = 'quoted'
            service_request.save(update_fields=['status', 'updated_at'])

        create_notification(
            user=service_request.buyer, type='service',
            title='💰 قیمت جدید اعلام شد',
            message=f'ارائه‌دهنده {user.full_name} برای "{service_request.title}" قیمت اعلام کرد.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        return Response({'success': True, 'message': 'قیمت ثبت شد', 'quote_id': quote.id})

    # ============================================================
    # force_majeure
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def force_majeure(self, request, pk=None):
        service_request = self.get_object()
        selected_quote = ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=True
        ).select_related('provider').first()
        assigned_provider = (
            selected_quote.provider if selected_quote
            else (service_request.service.provider if service_request.service else None)
        )

        if request.user != assigned_provider and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if service_request.status not in ['accepted', 'in_progress']:
            return Response({'error': 'وضعیت قابل تغییر نیست'}, status=400)

        serializer = ForceMajeureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service_request.force_majeure_declared = True
        service_request.force_majeure_reason = serializer.validated_data['reason']
        service_request.save()

        create_notification(
            user=service_request.buyer, type='service',
            title='اعلام فورس ماژور',
            message=f'ارائه‌دهنده برای "{service_request.title}" فورس ماژور اعلام کرد.\nدلیل: {service_request.force_majeure_reason}',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        for admin in User.objects.filter(role='admin'):
            create_notification(
                user=admin, type='service',
                title='فورس ماژور اعلام شد',
                message=f'فورس ماژور برای "{service_request.title}" توسط {request.user.full_name}',
                link=f'/dashboard/admin'
            )

        return Response({'success': True, 'message': 'فورس ماژور ثبت شد.'})

    # ============================================================
    # submit_review
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_review(self, request, pk=None):
        service_request = self.get_object()
        if not service_request.can_be_requested_by(request.user):
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)
        if service_request.status != ServiceRequest.Status.COMPLETED:
            return Response({'error': 'خدمت هنوز تأیید نشده'}, status=400)
        if service_request.buyer_rating:
            return Response({'error': 'قبلاً امتیاز ثبت شده'}, status=400)

        try:
            from reviews.models import Review
            rating = int(request.data.get('rating', 5))
            review_text = request.data.get('review', '')

            service_request.buyer_rating = rating
            service_request.buyer_review = review_text
            service_request.reviewed_at = timezone.now()
            service_request.save()

            Review.objects.create(
                user=service_request.buyer,
                service=service_request.service,
                service_request=service_request,
                rating=rating,
                comment=review_text,
                is_verified_purchase=True,
                is_approved=True,
            )

            if service_request.service:
                provider_profile = service_request.service.provider.profile
                all_ratings = ServiceRequest.objects.filter(
                    service__provider=service_request.service.provider,
                    buyer_rating__isnull=False
                ).values_list('buyer_rating', flat=True)
                if all_ratings:
                    provider_profile.rating = round(sum(all_ratings) / len(all_ratings), 1)
                    provider_profile.rating_count = len(all_ratings)
                    provider_profile.save()

            return Response({'success': True, 'message': f'امتیاز {rating} ثبت شد'})

        except Exception as e:
            return Response({'error': str(e)}, status=500)

    # ============================================================
    # admin_update_status
    # ============================================================
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def admin_update_status(self, request, pk=None):
        service_request = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'وضعیت جدید مشخص نشده'}, status=400)

        valid_statuses = [choice[0] for choice in ServiceRequest.Status.choices]
        if new_status not in valid_statuses:
            return Response({'error': f'وضعیت نامعتبر. مجاز: {valid_statuses}'}, status=400)

        old_status = service_request.status
        service_request.status = new_status
        service_request.save()

        create_notification(
            user=service_request.buyer, type='service',
            title='تغییر وضعیت توسط ادمین',
            message=f'وضعیت "{service_request.title}" از {old_status} به {new_status} تغییر کرد.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        if service_request.service and service_request.service.provider:
            create_notification(
                user=service_request.service.provider, type='service',
                title='تغییر وضعیت توسط ادمین',
                message=f'وضعیت "{service_request.title}" از {old_status} به {new_status} تغییر کرد.',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        return Response({
            'success': True,
            'message': f'وضعیت به {new_status} تغییر کرد',
            'old_status': old_status,
            'new_status': new_status
        })
