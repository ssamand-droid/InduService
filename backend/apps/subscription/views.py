from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """مشاهده طرح‌های اشتراک"""
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]


class SubscriptionViewSet(viewsets.ModelViewSet):
    """مدیریت اشتراک کاربر"""
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """اشتراک فعال کاربر"""
        sub = Subscription.get_active_subscription(request.user)
        if sub:
            return Response(SubscriptionSerializer(sub).data)
        return Response(None, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def my_subscription(self, request):
        """آخرین اشتراک کاربر"""
        sub = Subscription.objects.filter(user=request.user).first()
        if sub:
            return Response(SubscriptionSerializer(sub).data)
        return Response({'detail': 'بدون اشتراک'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def usage_stats(self, request):
        """آمار مصرف کاربر"""
        sub = Subscription.get_active_subscription(request.user)

        from assets.models import Asset
        assets_count = Asset.objects.filter(owner=request.user, is_active=True).count()

        max_assets = sub.max_assets_allowed if sub else 5

        return Response({
            'assets_used': assets_count,
            'assets_limit': max_assets,
            'assets_percentage': round(assets_count / max_assets * 100, 1) if max_assets > 0 else 0,
            'plan_name': sub.plan.name if sub else 'رایگان',
        })

    @action(detail=False, methods=['post'])
    def upgrade(self, request):
        """ارتقاء اشتراک"""
        plan_slug = request.data.get('plan_slug')
        billing_cycle = request.data.get('billing_cycle', 'monthly')

        try:
            plan = Plan.objects.get(slug=plan_slug)
        except Plan.DoesNotExist:
            return Response({'error': 'طرح نامعتبر'}, status=400)

        # غیرفعال کردن اشتراک فعلی
        Subscription.objects.filter(user=request.user, status='active').update(status='cancelled')

        # ایجاد اشتراک جدید
        from dateutil.relativedelta import relativedelta
        duration = relativedelta(years=1) if billing_cycle == 'yearly' else relativedelta(months=1)

        sub = Subscription.objects.create(
            user=request.user,
            plan=plan,
            status='active',
            billing_cycle=billing_cycle,
            start_date=timezone.now(),
            end_date=timezone.now() + duration,
        )

        return Response(SubscriptionSerializer(sub).data, status=201)

    @action(detail=False, methods=['post'])
    def cancel(self, request):
        """لغو اشتراک"""
        Subscription.objects.filter(user=request.user, status='active').update(
            status='cancelled',
            cancelled_at=timezone.now()
        )
        return Response({'message': 'اشتراک لغو شد'})