# backend/apps/services/views.py

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models as db_models, transaction
from .models import ServiceCategory, Service, ServiceRequest, ServiceRequestAttachment, ServiceCompletionImage, ServiceRequestQuote
from .serializers import (
    ServiceCategorySerializer, ServiceListSerializer, ServiceDetailSerializer,
    ServiceCreateUpdateSerializer, ServiceRequestSerializer, ServiceRequestUpdateSerializer,
    ServiceRequestAttachmentSerializer, ProviderQuoteSerializer,
    ForceMajeureSerializer, ReviewSerializer,
)
from core.permissions import IsSeller, IsBuyer
from users.models import User
from notification.services import create_notification
from payment.models import Invoice, Wallet, WalletTransaction
from django.utils.text import slugify
import uuid
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Service


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'


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


class ServiceMatchView(APIView):
    """پیدا کردن سرویس مرتبط با درخواست بر اساس کلمات کلیدی"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        equipment_details = request.data.get('equipment_details', '')

        search_text = f"{title} {description} {equipment_details}".lower()

        # جستجو در سرویس‌های فعال
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


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.select_related('buyer', 'service').all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ============================================================
    # اصلاح get_queryset در کلاس ServiceRequestViewSet برای نمایش درخواست‌های بدون سرویس
    # ============================================================
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return ServiceRequest.objects.none()

        # ادمین همه را می‌بیند
        if user.role == 'admin' or user.is_staff:
            return ServiceRequest.objects.select_related('buyer', 'service__provider').all().order_by('-created_at')

        # ارائه‌دهنده: درخواست‌های مستقیم + سناریو مرتبط + بدون سرویس
        if user.role in ['seller', 'service_provider', 'company_seller', 'company_provider']:
            from .models import Service
            from notification.models import Notification

            # 1. درخواست‌هایی که مستقیماً برای خدمات این ارائه‌دهنده ثبت شده
            direct_requests = ServiceRequest.objects.filter(service__provider=user)

            # 2. سناریوهای خدماتی که این ارائه‌دهنده ارائه می‌دهد
            user_service_scenarios = Service.objects.filter(
                provider=user,
                is_active=True,
                is_deleted=False
            ).values_list('service_scenario', flat=True).distinct()

            # 3. درخواست‌هایی که سناریوی آنها با تخصص ارائه‌دهنده مطابقت دارد
            scenario_requests = ServiceRequest.objects.filter(
                service__isnull=False,
                service__service_scenario__in=user_service_scenarios,
                status__in=['pending', 'reviewed', 'quoted']
            ).exclude(service__provider=user)

            # 4. درخواست‌های بدون سرویس (service=null)
            free_requests = ServiceRequest.objects.filter(
                service__isnull=True,
                status__in=['pending', 'reviewed', 'quoted']
            ).exclude(buyer=user)

            # 5. درخواست‌هایی که کاربر برای آنها نوتیفیکیشن گرفته
            notified_request_ids = Notification.objects.filter(
                user=user,
                type='service_request',
                extra_data__has_key='request_id'
            ).values_list('extra_data__request_id', flat=True).distinct()

            notified_requests = ServiceRequest.objects.filter(
                id__in=notified_request_ids,
                status__in=['pending', 'reviewed', 'quoted']
            ).exclude(buyer=user)

            return (direct_requests | scenario_requests | free_requests | notified_requests).select_related(
                'buyer', 'service__provider'
            ).prefetch_related('quotes', 'quotes__provider').order_by('-created_at').distinct()

        # خریدار: فقط درخواست‌های خودش
        if user.role == 'buyer':
            return ServiceRequest.objects.filter(
                buyer=user
            ).select_related('service__provider').prefetch_related('quotes', 'quotes__provider').order_by('-created_at')

        return ServiceRequest.objects.none()

    def get_object(self):
        """
        اطمینان از دسترسی کاربر به درخواست مورد نظر برای مشاهده جزئیات
        """
        obj = super().get_object()
        user = self.request.user

        # ادمین همیشه دسترسی دارد
        if user.role == 'admin' or user.is_staff:
            return obj

        # خریدار: فقط درخواست‌های خودش
        if user.role == 'buyer' and obj.buyer == user:
            return obj

        # ============================================================
        # ارائه‌دهنده: دسترسی به درخواست‌های مرتبط
        # ============================================================
        if user.role in ['seller', 'service_provider', 'company_seller', 'company_provider']:
            # دسترسی مستقیم (درخواست برای خدمات خودش)
            if obj.service and obj.service.provider == user:
                return obj

            # دسترسی به درخواست‌های دارای سرویس مرتبط با سناریو
            from .models import Service
            user_service_scenarios = Service.objects.filter(
                provider=user,
                is_active=True,
                is_deleted=False
            ).values_list('service_scenario', flat=True).distinct()

            if obj.service and obj.service.service_scenario in user_service_scenarios:
                if obj.status in ['pending', 'reviewed', 'quoted']:
                    return obj

            # ============================================================
            # درخواست‌های بدون سرویس (service=null) - همه را ببین
            # ============================================================
            if obj.service is None:
                if obj.status in ['pending', 'reviewed', 'quoted'] and obj.buyer != user:
                    return obj

            # ============================================================
            # بررسی اینکه آیا این ارائه‌دهنده قبلاً برای این درخواست نوتیفیکیشن گرفته
            # ============================================================
            from notification.models import Notification
            has_notification = Notification.objects.filter(
                user=user,
                type='service_request',
                extra_data__request_id=obj.id
            ).exists()

            if has_notification and obj.status in ['pending', 'reviewed', 'quoted']:
                return obj

        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("شما دسترسی به این درخواست ندارید")

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def match_providers(self, request, pk=None):
        """
        🎯 Matching Engine: یافتن ۳ پیمانکار برتر برای یک درخواست خدمت
        """
        service_request = self.get_object()

        # فقط خریدار صاحب درخواست می‌تواند پیمانکاران را ببیند
        if service_request.buyer != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        # چک کردن اینکه Matching Engine فعال باشد
        matching_enabled = service_request.extra_data.get('matching_enabled', True)
        if not matching_enabled and not request.user.is_staff:
            return Response({
                'success': False,
                'message': 'Matching Engine برای این درخواست غیرفعال است',
                'matching_enabled': False,
            }, status=403)

        try:
            from .matching_engine import MatchingEngine

            # چک کردن cache: اگر قبلاً اجرا شده، از کش بخوان
            cached = service_request.extra_data.get('matched_providers')
            if cached and not request.query_params.get('refresh'):
                results = cached
            else:
                results = MatchingEngine.find_best_providers(service_request)
                # ذخیره در extra_data برای استفاده بعدی
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

    def perform_create(self, serializer):
        from notification.services import find_matching_service, notify_matching_providers, create_notification
        from users.models import User
        from assets.models import Asset  # اضافه شود

        service_id = self.request.data.get('service')
        title = self.request.data.get('title', '')
        description = self.request.data.get('description', '')
        equipment_details = self.request.data.get('equipment_details', '')
        extra_data = self.request.data.get('extra_data', {})
        industry = self.request.data.get('industry', '')  # اضافه شود
        asset_id = self.request.data.get('related_asset', '')  # اضافه شود

        # دریافت نام دستگاه از دارایی
        asset_name = ''
        if asset_id:
            try:
                asset = Asset.objects.get(id=asset_id)
                asset_name = asset.name
                print(f"📍 Asset found: {asset_name}")
            except Asset.DoesNotExist:
                pass

        # ============================================================
        # تلاش برای پیدا کردن سرویس مرتبط (با اطلاعات کامل)
        # ============================================================
        matched_service = None

        # روش 1: اگر خریدار سرویس انتخاب کرده
        if service_id:
            try:
                matched_service = Service.objects.get(id=service_id, is_active=True, is_deleted=False)
                print(f"✅ Service selected by buyer: {matched_service.title}")
            except Service.DoesNotExist:
                pass

        # روش 2: جستجوی خودکار (با صنعت و نام دستگاه)
        if not matched_service:
            matched_service = find_matching_service(
                title, description, equipment_details, extra_data,
                industry=industry, asset_name=asset_name  # اضافه شد
            )
            if matched_service:
                print(f"🔍 Auto-matched service: {matched_service.title} (ID: {matched_service.id})")

        # ============================================================
        # ذخیره درخواست
        # ============================================================
        service_request = serializer.save(
            buyer=self.request.user,
            service=matched_service
        )

        # ============================================================
        # اگر سرویس پیدا نشد - ارسال اعلان به ادمین
        # ============================================================
        if not matched_service:
            print(f"⚠️ No service matched for request #{service_request.id}")

            # ذخیره در session برای نمایش پیغام به خریدار
            self.request.session['unmatched_request'] = True
            self.request.session['unmatched_request_id'] = service_request.id

            # اعلان به ادمین
            admins = User.objects.filter(role='admin')
            for admin in admins:
                create_notification(
                    user=admin,
                    type='service_request',
                    title='⚠️ درخواست بدون سرویس منطبق',
                    message=f'درخواست جدید "{service_request.title}" توسط {self.request.user.full_name} ثبت شده است. هیچ سرویس منطبقی یافت نشد. لطفاً بررسی کنید.',
                    link=f'/dashboard/admin/service-requests/{service_request.id}',
                    extra_data={
                        'request_id': service_request.id,
                        'needs_manual_review': True,
                    }
                )
                print(f"📧 Admin notification sent for unmatched request #{service_request.id}")

        # ============================================================
        # اگر سرویس پیدا شد - ارسال نوتیفیکیشن به ارائه‌دهندگان
        # ============================================================
        else:
            try:
                count = notify_matching_providers(service_request)
                print(f"🔔 Notified {count} matching providers for request #{service_request.id}")
            except Exception as e:
                print(f"⚠️ Notification error: {e}")

        return service_request

    # ============================================================
    # جایگزینی متد accept_quote در کلاس ServiceRequestViewSet
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept_quote(self, request, pk=None):
        """خریدار: انتخاب اتمیک یک پیشنهاد قیمت و صدور فاکتور برای همان ارائه‌دهنده."""
        from .models import ServiceRequestQuote
        from notification.services import create_notification
        from decimal import Decimal

        service_request = self.get_object()
        quote_id = request.data.get('quote_id')

        if not quote_id:
            return Response({'error': 'شناسه پیشنهاد مشخص نشده'}, status=400)

        if service_request.buyer != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        # قفل درخواست، بررسی و انتخاب پیشنهاد را در یک تراکنش نگه می‌دارد تا
        # دو درخواست هم‌زمان نتوانند دو پیشنهاد را انتخاب کنند.
        with transaction.atomic():
            service_request = ServiceRequest.objects.select_for_update().get(pk=service_request.pk)

            if service_request.status not in ['reviewed', 'quoted']:
                return Response({'error': 'وضعیت درخواست قابل قبول نیست'}, status=400)

            if ServiceRequestQuote.objects.filter(
                service_request=service_request, is_selected=True
            ).exists():
                return Response({
                    'error': 'برای این درخواست قبلاً یک پیشنهاد انتخاب شده است.'
                }, status=400)

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
                return Response({
                    'error': 'مبلغ پیش‌پرداخت باید بین صفر و مبلغ کل پیشنهاد باشد.'
                }, status=400)

            # فاکتور باید به ارائه‌دهنده پیشنهاد منتخب متصل باشد؛ درخواست ممکن
            # است از ابتدا service نداشته باشد یا سرویس اولیه با پیشنهاد فرق کند.
            invoice, invoice_created = Invoice.objects.get_or_create(
                service_request=service_request,
                defaults={
                    'buyer': service_request.buyer,
                    'seller': quote.provider,
                    'subtotal': total_price,
                    'total': total_price,
                    'advance_payment': float(advance),
                    'remaining_amount': float(total_price - advance),
                    'platform_commission_rate': 10,
                    'platform_commission_amount': float(total_price * Decimal('0.10')),
                    'status': 'issued',
                    'issued_at': timezone.now(),
                }
            )
            if not invoice_created and invoice.seller_id != quote.provider_id:
                return Response({
                    'error': 'برای این درخواست فاکتوری با ارائه‌دهنده دیگری وجود دارد؛ نیاز به بررسی مدیریتی است.'
                }, status=409)

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

        # اعلان‌ها خارج از تراکنش داده‌های اصلی ایجاد می‌شوند.
        create_notification(
            user=quote.provider,
            type='service',
            title='✅ پیشنهاد شما انتخاب شد',
            message=f'پیشنهاد شما برای درخواست "{service_request.title}" توسط خریدار انتخاب شد.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        for other_quote in ServiceRequestQuote.objects.filter(
            service_request=service_request, is_selected=False
        ).exclude(provider=quote.provider).select_related('provider'):
            create_notification(
                user=other_quote.provider,
                type='service',
                title='❌ پیشنهاد شما انتخاب نشد',
                message=f'پیشنهاد شما برای درخواست "{service_request.title}" توسط خریدار انتخاب نشد.',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        for admin in User.objects.filter(role='admin'):
            create_notification(
                user=admin,
                type='service',
                title='💰 قیمت نهایی انتخاب شد',
                message=f'درخواست "{service_request.title}" - قیمت نهایی: {total_price:,} ریال توسط {quote.provider.full_name}',
                link=f'/dashboard/admin/service-requests/{service_request.id}'
            )

        if advance > 0:
            create_notification(
                user=service_request.buyer,
                type='payment',
                title='نیاز به پیش‌پرداخت',
                message=f'پیش‌پرداخت: {advance:,} ریال | مابقی: {total_price - advance:,} ریال',
                link=f'/dashboard/service-requests/{service_request.id}'
            )
            return Response({
                'success': True,
                'message': f'قیمت پذیرفته شد. پیش‌پرداخت {advance:,} ریال را واریز کنید.',
                'advance_payment_required': True,
                'advance_payment_amount': float(advance),
                'remaining_amount': float(total_price - advance),
            })

        return Response({
            'success': True,
            'message': 'قیمت پذیرفته شد. ارائه‌دهنده منتخب می‌تواند کار را شروع کند.'
        })

    # ============================================================
    # 2. pay_advance - خریدار: ثبت رسید پیش‌پرداخت
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def pay_advance(self, request, pk=None):
        """خریدار یا ادمین: ثبت رسید پیش‌پرداخت"""
        service_request = self.get_object()

        # اجازه به خریدار و ادمین
        if service_request.buyer != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if not service_request.advance_payment_required:
            return Response({'error': 'این خدمت نیاز به پیش‌پرداخت ندارد'}, status=400)

        if 'receipt' not in request.FILES:
            return Response({'error': 'رسید پرداخت الزامی است'}, status=400)

        # ذخیره رسید
        if hasattr(service_request, 'invoice'):
            invoice = service_request.invoice
            invoice.payment_receipt = request.FILES['receipt']
            invoice.status = 'partially_paid'
            invoice.save()

        service_request.advance_payment_paid = True
        service_request.status = ServiceRequest.Status.ACCEPTED
        service_request.final_price = service_request.quoted_price
        service_request.save()

        # اعلان به ارائه‌دهنده
        create_notification(
            user=service_request.service.provider,
            type='payment',
            title='پیش‌پرداخت واریز شد',
            message=f'پیش‌پرداخت خدمت "{service_request.title}" پرداخت شد. می‌توانید کار را شروع کنید.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        # اعلان به ادمین
        admins = User.objects.filter(role='admin')
        for admin in admins:
            create_notification(
                user=admin,
                type='payment',
                title='پیش‌پرداخت ثبت شد',
                message=f'رسید پیش‌پرداخت برای درخواست "{service_request.title}" آپلود شد.',
                link=f'/dashboard/admin/orders'
            )

        return Response({'success': True, 'message': 'پیش‌پرداخت ثبت شد. ارائه‌دهنده می‌تواند کار را شروع کند.'})

    # ============================================================
    # 3. start_work - ارائه‌دهنده یا ادمین کار را شروع می‌کند
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_work(self, request, pk=None):
        """ارائه‌دهنده یا ادمین کار را شروع می‌کند"""
        service_request = self.get_object()

        # اجازه به ارائه‌دهنده و ادمین
        if service_request.service.provider != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_403_FORBIDDEN)

        if service_request.status != ServiceRequest.Status.ACCEPTED:
            return Response({'error': 'ابتدا باید درخواست پذیرفته شود'}, status=status.HTTP_400_BAD_REQUEST)

        service_request.status = ServiceRequest.Status.IN_PROGRESS
        service_request.save()

        return Response({'message': 'شروع فرآیند ثبت شد.'})

    # ============================================================
    # 4. final_payment - خریدار: پرداخت نهایی
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def final_payment(self, request, pk=None):
        """خریدار یا ادمین: پرداخت نهایی و تکمیل"""
        service_request = self.get_object()

        # اجازه به خریدار و ادمین
        if service_request.buyer != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if service_request.status != 'completed':
            return Response({'error': 'خدمت هنوز تکمیل نشده'}, status=400)

        if 'receipt' not in request.FILES:
            return Response({'error': 'رسید الزامی است'}, status=400)

        invoice = getattr(service_request, 'invoice', None)
        if not invoice:
            return Response({'error': 'فاکتوری وجود ندارد'}, status=400)

        # ذخیره رسید پرداخت نهایی
        invoice.payment_receipt = request.FILES['receipt']
        invoice.payment_verified = False
        invoice.status = Invoice.InvoiceStatus.ISSUED
        invoice.save()

        create_notification(
            user=service_request.buyer,
            type='payment',
            title='📎 رسید پرداخت نهایی آپلود شد',
            message='رسید شما در انتظار تایید ادمین است.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        return Response({'success': True, 'message': 'رسید پرداخت نهایی آپلود شد. در انتظار تایید ادمین.'})

    # ============================================================
    # 5. complete - ارائه‌دهنده یا ادمین خدمت را تکمیل می‌کند
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        """ارائه‌دهنده منتخب یا ادمین خدمت در حال اجرا را تکمیل می‌کند."""
        from .models import ServiceRequestQuote

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
            return Response({'error': 'وضعیت فعلی قابل تکمیل نیست'}, status=status.HTTP_400_BAD_REQUEST)

        service_request.status = ServiceRequest.Status.COMPLETED
        service_request.actual_completion_date = timezone.now()
        service_request.completion_notes = request.data.get(
            'completion_notes', service_request.completion_notes
        )
        service_request.save(update_fields=[
            'status', 'actual_completion_date', 'completion_notes', 'updated_at'
        ])

        return Response({'message': 'خدمت توسط ارائه‌دهنده تکمیل شد؛ پذیرش نهایی خریدار مرحله جداگانه‌ای است.'})

    # ============================================================
    # 6. upload_attachment - آپلود فایل ضمیمه
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_attachment(self, request, pk=None):
        """آپلود فایل ضمیمه برای درخواست خدمت"""
        service_request = self.get_object()

        if service_request.buyer != request.user:
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
    # 7. update_request - ویرایش درخواست توسط خریدار
    # ============================================================
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_request(self, request, pk=None):
        service_request = self.get_object()
        if service_request.buyer != request.user:
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
    # 8. provider_quote - ارائه‌دهنده اعلام قیمت می‌کند
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def provider_quote(self, request, pk=None):
        """ارائه‌دهنده: اعلام قیمت با جزئیات کامل (چندین ارائه‌دهنده می‌توانند قیمت اعلام کنند)"""
        from .models import ServiceRequestQuote
        from notification.services import create_notification
        from notification.models import Notification

        service_request = self.get_object()
        user = request.user

        # ============================================================
        # بررسی: آیا خریدار قبلاً پیشنهادی را انتخاب کرده است؟
        # ============================================================
        already_selected = ServiceRequestQuote.objects.filter(
            service_request=service_request,
            is_selected=True
        ).exists()

        if already_selected:
            return Response({
                'error': 'خریدار قبلاً یک پیشنهاد را انتخاب کرده است. امکان اعلام قیمت جدید وجود ندارد.'
            }, status=400)

        # ============================================================
        # بررسی دسترسی: آیا این کاربر برای این درخواست نوتیفیکیشن گرفته است؟
        # ============================================================
        has_notification = Notification.objects.filter(
            user=user,
            type='service_request',
            extra_data__request_id=service_request.id
        ).exists()

        is_admin = user.is_staff or user.role == 'admin'
        is_direct_provider = service_request.service and service_request.service.provider == user

        if not (has_notification or is_admin or is_direct_provider):
            return Response({
                'error': 'شما دسترسی به اعلام قیمت برای این درخواست ندارید'
            }, status=403)

        # بررسی وضعیت درخواست
        if service_request.status not in ['pending', 'reviewed', 'quoted']:
            return Response({
                'error': 'در این مرحله نمی‌توانید قیمت اعلام کنید'
            }, status=400)

        serializer = ProviderQuoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ایجاد یا به‌روزرسانی پیشنهاد قیمت
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

        # پس از ثبت پیشنهاد، وضعیت درخواست نشان می‌دهد که قیمت دریافت شده است.
        # تا قبل از انتخاب پیشنهاد توسط خریدار، ارائه‌دهندگان مجاز دیگر نیز می‌توانند قیمت بدهند.
        if service_request.status in ['pending', 'reviewed']:
            service_request.status = 'quoted'
            service_request.save(update_fields=['status', 'updated_at'])

        # اعلان به خریدار
        create_notification(
            user=service_request.buyer,
            type='service',
            title='💰 قیمت جدید اعلام شد',
            message=f'ارائه‌دهنده {user.full_name} برای درخواست "{service_request.title}" قیمت اعلام کرد.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        return Response({
            'success': True,
            'message': 'قیمت با موفقیت اعلام شد',
            'quote_id': quote.id
        })

    # ============================================================
    # 9. force_majeure - ارائه‌دهنده فورس ماژور اعلام می‌کند
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def force_majeure(self, request, pk=None):
        """ارائه‌دهنده یا ادمین: اعلام فورس ماژور"""
        service_request = self.get_object()

        # اجازه به ارائه‌دهنده و ادمین
        if request.user != service_request.service.provider and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if service_request.status not in ['accepted', 'in_progress']:
            return Response({'error': 'وضعیت قابل تغییر نیست'}, status=400)

        serializer = ForceMajeureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service_request.force_majeure_declared = True
        service_request.force_majeure_reason = serializer.validated_data['reason']
        service_request.save()

        # اعلان به خریدار
        create_notification(
            user=service_request.buyer,
            type='service',
            title='اعلام فورس ماژور',
            message=f'ارائه‌دهنده برای درخواست "{service_request.title}" فورس ماژور اعلام کرد.\nدلیل: {service_request.force_majeure_reason}',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        # اعلان به ادمین
        for admin in User.objects.filter(role='admin'):
            create_notification(
                user=admin,
                type='service',
                title='فورس ماژور اعلام شد',
                message=f'فورس ماژور برای درخواست "{service_request.title}" توسط {request.user.full_name}',
                link=f'/dashboard/admin'
            )

        return Response({'success': True, 'message': 'فورس ماژور ثبت شد و به خریدار اطلاع داده شد.'})

    # ============================================================
    # 10. complete_with_images - تکمیل خدمت با عکس
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete_with_images(self, request, pk=None):
        """ارائه‌دهنده یا ادمین: تکمیل خدمت با آپلود عکس"""
        service_request = self.get_object()

        # اجازه به ارائه‌دهنده و ادمین
        if request.user != service_request.service.provider and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if service_request.status != 'in_progress':
            return Response({'error': 'خدمت در حال انجام نیست'}, status=400)

        # ذخیره یادداشت
        service_request.completion_notes = request.data.get('completion_notes', '')
        service_request.status = 'completed'
        service_request.actual_completion_date = timezone.now()
        service_request.save()

        # ذخیره تصاویر
        saved_images = []
        for image in request.FILES.getlist('images'):
            img = ServiceCompletionImage.objects.create(
                service_request=service_request,
                image=image
            )
            saved_images.append({
                'id': img.id,
                'url': request.build_absolute_uri(img.image.url),
            })

        # به‌روزرسانی آمار پروفایل
        profile = request.user.profile
        profile.completed_orders += 1
        profile.total_revenue += (service_request.final_price or service_request.quoted_price or 0)
        profile.save()

        # اعلان به خریدار
        create_notification(
            user=service_request.buyer,
            type='service',
            title='خدمت تکمیل شد',
            message=f'خدمت "{service_request.title}" تکمیل شد. لطفاً نتیجه را بررسی و تایید کنید.',
            link=f'/dashboard/service-requests/{service_request.id}',
            extra_data={'images': saved_images}
        )

        return Response({
            'success': True,
            'message': 'خدمت تکمیل شد',
            'images': saved_images,
        })

    # ============================================================
    # 11. submit_review - خریدار ثبت امتیاز می‌کند
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_review(self, request, pk=None):
        """خریدار: ثبت امتیاز و نظر"""
        service_request = self.get_object()

        if request.user != service_request.buyer:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if service_request.status != 'completed':
            return Response({'error': 'خدمت هنوز تکمیل نشده'}, status=400)

        if service_request.buyer_rating:
            return Response({'error': 'قبلاً امتیاز ثبت شده'}, status=400)

        try:
            from reviews.models import Review

            rating = int(request.data.get('rating', 5))
            review_text = request.data.get('review', '')

            # ذخیره در ServiceRequest
            service_request.buyer_rating = rating
            service_request.buyer_review = review_text
            service_request.reviewed_at = timezone.now()
            service_request.save()

            # ایجاد Review در جدول نظرات
            Review.objects.create(
                user=service_request.buyer,
                service=service_request.service,
                service_request=service_request,
                rating=rating,
                comment=review_text,
                is_verified_purchase=True,
                is_approved=True,
            )

            # به‌روزرسانی امتیاز ارائه‌دهنده
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
    # 12. upload_payment_receipt - آپلود رسید پرداخت
    # ============================================================
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_payment_receipt(self, request, pk=None):
        """خریدار یا ادمین: آپلود رسید پرداخت"""
        service_request = self.get_object()

        # اجازه به خریدار و ادمین
        if service_request.buyer != request.user and not request.user.is_staff:
            return Response({'error': 'دسترسی غیرمجاز'}, status=403)

        if 'receipt' not in request.FILES:
            return Response({'error': 'رسید الزامی است'}, status=400)

        invoice = getattr(service_request, 'invoice', None)
        if not invoice:
            return Response({'error': 'فاکتوری وجود ندارد'}, status=400)

        payment_type = request.data.get('payment_type', 'final')

        # ذخیره رسید
        invoice.payment_receipt = request.FILES['receipt']

        if payment_type == 'advance':
            service_request.advance_payment_paid = True

        # مهم: payment_verified را False بگذار
        invoice.payment_verified = False
        invoice.status = Invoice.InvoiceStatus.ISSUED
        invoice.save()
        service_request.save()

        return Response({'success': True, 'message': 'رسید آپلود شد. در انتظار تایید ادمین.'})

    # ============================================================
    # 13. admin_update_status - ادمین تغییر وضعیت مستقیم
    # ============================================================
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def admin_update_status(self, request, pk=None):
        """ادمین: تغییر مستقیم وضعیت درخواست"""
        service_request = self.get_object()

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'وضعیت جدید مشخص نشده'}, status=400)

        valid_statuses = [choice[0] for choice in ServiceRequest.Status.choices]
        if new_status not in valid_statuses:
            return Response({'error': f'وضعیت نامعتبر. وضعیت‌های مجاز: {valid_statuses}'}, status=400)

        old_status = service_request.status
        service_request.status = new_status
        service_request.save()

        # اعلان به خریدار
        create_notification(
            user=service_request.buyer,
            type='service',
            title='تغییر وضعیت درخواست توسط ادمین',
            message=f'وضعیت درخواست "{service_request.title}" از {old_status} به {new_status} تغییر کرد.',
            link=f'/dashboard/service-requests/{service_request.id}'
        )

        # اعلان به ارائه‌دهنده (اگر وجود داشته باشد)
        if service_request.service and service_request.service.provider:
            create_notification(
                user=service_request.service.provider,
                type='service',
                title='تغییر وضعیت درخواست توسط ادمین',
                message=f'وضعیت درخواست "{service_request.title}" از {old_status} به {new_status} تغییر کرد.',
                link=f'/dashboard/service-requests/{service_request.id}'
            )

        return Response({
            'success': True,
            'message': f'وضعیت با موفقیت به {new_status} تغییر کرد',
            'old_status': old_status,
            'new_status': new_status
        })