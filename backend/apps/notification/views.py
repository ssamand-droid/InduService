from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer, MarkReadSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(user=user)

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """علامت‌گذاری به عنوان خوانده شده"""
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data['notification_ids']
        self.get_queryset().filter(id__in=ids).update(is_read=True, read_at=timezone.now())
        return Response({'message': f'{len(ids)} اعلان خوانده شد.'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """خواندن همه اعلان‌ها"""
        if not request.user.is_authenticated:
            return Response({'error': 'احراز هویت الزامی است'}, status=401)
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({'message': 'همه اعلان‌ها خوانده شدند.'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """تعداد اعلان‌های خوانده نشده"""
        if not request.user.is_authenticated:
            return Response({'unread_count': 0})
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})