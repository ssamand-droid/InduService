# from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import action
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta
from users.models import User
from orders.models import Order
from services.models import ServiceRequest, Service
from products.models import Product
from payment.models import Invoice, Transaction
from .models import PlatformSetting
from .serializers import PlatformSettingSerializer


class PlatformSettingViewSet(viewsets.ModelViewSet):
    """تنظیمات داینامیک پلتفرم"""
    queryset = PlatformSetting.objects.all()
    serializer_class = PlatformSettingSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """گروه‌بندی تنظیمات بر اساس نوع"""
        settings = PlatformSetting.objects.filter(is_active=True)
        data = {}
        for setting in settings:
            if setting.setting_type not in data:
                data[setting.setting_type] = []
            data[setting.setting_type].append({
                'key': setting.key,
                'value': setting.value,
                'title': setting.title,
            })
        return Response(data)


class AdminDashboardView(APIView):
    """داشبورد کامل ادمین"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        data = {
            'users': {
                'total': User.objects.count(),
                'buyers': User.objects.filter(role='buyer').count(),
                'sellers': User.objects.filter(role='seller').count(),
                'service_providers': User.objects.filter(role='service_provider').count(),
                'new_this_week': User.objects.filter(date_joined__gte=week_ago).count(),
                'new_this_month': User.objects.filter(date_joined__gte=month_ago).count(),
                'verified': User.objects.filter(is_verified=True).count(),
            },
            'orders': {
                'total': Order.objects.count(),
                'pending': Order.objects.filter(status='pending').count(),
                'confirmed': Order.objects.filter(status='confirmed').count(),
                'processing': Order.objects.filter(status='processing').count(),
                'shipped': Order.objects.filter(status='shipped').count(),
                'completed': Order.objects.filter(status='completed').count(),
                'cancelled': Order.objects.filter(status='cancelled').count(),
                'new_this_week': Order.objects.filter(created_at__gte=week_ago).count(),
            },
            'service_requests': {
                'total': ServiceRequest.objects.count(),
                'pending': ServiceRequest.objects.filter(status='pending').count(),
                'reviewed': ServiceRequest.objects.filter(status='reviewed').count(),
                'quoted': ServiceRequest.objects.filter(status='quoted').count(),
                'accepted': ServiceRequest.objects.filter(status='accepted').count(),
                'in_progress': ServiceRequest.objects.filter(status='in_progress').count(),
                'completed': ServiceRequest.objects.filter(status='completed').count(),
                'cancelled': ServiceRequest.objects.filter(status='cancelled').count(),
            },
            'products': {
                'total': Product.objects.count(),
                'active': Product.objects.filter(is_active=True).count(),
                'out_of_stock': Product.objects.filter(stock_quantity=0, is_active=True).count(),
            },
            'services': {
                'total': Service.objects.count(),
                'active': Service.objects.filter(is_active=True).count(),
            },
            'finance': {
                'total_revenue': Invoice.objects.filter(status='paid').aggregate(t=Sum('total'))['t'] or 0,
                'total_commission': Invoice.objects.filter(status='paid').aggregate(t=Sum('platform_commission_amount'))['t'] or 0,
                'pending_payments': Invoice.objects.filter(status='issued').count(),
                'paid_this_month': Invoice.objects.filter(paid_at__gte=month_ago, status='paid').aggregate(t=Sum('total'))['t'] or 0,
                'commission_this_month': Invoice.objects.filter(paid_at__gte=month_ago, status='paid').aggregate(t=Sum('platform_commission_amount'))['t'] or 0,
            },
            'charts': {
                'orders_by_status': self.get_orders_by_status(),
                'requests_by_status': self.get_requests_by_status(),
                'revenue_last_30_days': self.get_revenue_chart(30),
                'new_users_last_7_days': self.get_new_users_chart(7),
                'commission_vs_revenue': self.get_commission_chart(),
            },
            'recent_activity': self.get_recent_activity(),
        }

        return Response(data)

    def get_orders_by_status(self):
        statuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled']
        return [{'status': s, 'count': Order.objects.filter(status=s).count()} for s in statuses]

    def get_requests_by_status(self):
        statuses = ['pending', 'reviewed', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled']
        return [{'status': s, 'count': ServiceRequest.objects.filter(status=s).count()} for s in statuses]

    def get_revenue_chart(self, days):
        data = []
        for i in range(days):
            date = timezone.now() - timedelta(days=i)
            day_total = Invoice.objects.filter(paid_at__date=date.date(), status='paid').aggregate(t=Sum('total'))['t'] or 0
            data.append({'date': date.strftime('%Y-%m-%d'), 'revenue': day_total})
        return list(reversed(data))

    def get_new_users_chart(self, days):
        data = []
        for i in range(days):
            date = timezone.now() - timedelta(days=i)
            count = User.objects.filter(date_joined__date=date.date()).count()
            data.append({'date': date.strftime('%Y-%m-%d'), 'count': count})
        return list(reversed(data))

    def get_commission_chart(self):
        total_rev = Invoice.objects.filter(status='paid').aggregate(t=Sum('total'))['t'] or 1
        total_com = Invoice.objects.filter(status='paid').aggregate(t=Sum('platform_commission_amount'))['t'] or 0
        return [
            {'label': 'درآمد کل', 'value': total_rev},
            {'label': 'کمیسیون', 'value': total_com},
        ]

    def get_recent_activity(self):
        activities = []
        for order in Order.objects.select_related('buyer', 'seller').order_by('-created_at')[:5]:
            activities.append({
                'type': 'order', 'id': order.id,
                'message': f'سفارش {order.order_number} - {order.get_status_display()}',
                'buyer': order.buyer.full_name, 'seller': order.seller.full_name,
                'date': order.created_at,
            })
        for req in ServiceRequest.objects.select_related('buyer', 'service__provider').order_by('-created_at')[:5]:
            activities.append({
                'type': 'service_request', 'id': req.id,
                'message': f'درخواست {req.title} - {req.get_status_display()}',
                'buyer': req.buyer.full_name,
                'provider': req.service.provider.full_name if req.service else '---',
                'date': req.created_at,
            })
        for user in User.objects.order_by('-date_joined')[:5]:
            activities.append({
                'type': 'user', 'id': user.id,
                'message': f'کاربر جدید: {user.full_name} ({user.get_role_display()})',
                'date': user.date_joined,
            })
        return sorted(activities, key=lambda x: x['date'], reverse=True)[:15]


class AdminUserManagementView(APIView):
    """مدیریت کاربران توسط ادمین"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().values(
            'id', 'phone_number', 'email', 'first_name', 'last_name',
            'role', 'is_verified', 'is_active', 'date_joined'
        ).order_by('-date_joined')
        return Response(list(users))

    def patch(self, request):
        user_id = request.data.get('user_id')
        action = request.data.get('action')
        try:
            user = User.objects.get(id=user_id)
            if action == 'toggle_active':
                user.is_active = not user.is_active
            elif action == 'verify':
                user.is_verified = True
            elif action == 'change_role':
                user.role = request.data.get('role')
            user.save()
            return Response({'success': True})
        except User.DoesNotExist:
            return Response({'error': 'کاربر یافت نشد'}, status=404)