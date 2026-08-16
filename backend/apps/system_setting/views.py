"""apps/system_setting/views.py"""
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response

from .models import SystemSetting
from .serializers import (
    SystemSettingSerializer, SystemSettingPublicSerializer,
    SystemSettingCreateSerializer, SystemSettingUpdateSerializer,
)


def ok(data, code=status.HTTP_200_OK):
    return Response({"success": True, "data": data}, status=code)

def err(msg, code=status.HTTP_400_BAD_REQUEST):
    return Response({"success": False, "message": msg}, status=code)


# ── عمومی (بدون لاگین) ────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def public_settings(request):
    """تنظیماتی که is_public=True هستند — بدون نیاز به لاگین."""
    qs   = SystemSetting.objects.filter(is_public=True)
    data = {s.key: s.value for s in qs}
    return ok(data)


# ── ادمین: مدیریت کامل ────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def setting_list_create(request):
    """
    GET  — لیست همه تنظیمات (ادمین)
    POST — ایجاد تنظیم جدید
    """
    if request.method == "GET":
        qs = SystemSetting.objects.all()

        setting_type = request.query_params.get("type")
        if setting_type:
            qs = qs.filter(setting_type=setting_type)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(key__icontains=search) | qs.filter(title__icontains=search)

        return Response({
            "success": True,
            "count":   qs.count(),
            "results": SystemSettingSerializer(qs, many=True).data,
        })

    # POST
    s = SystemSettingCreateSerializer(data=request.data)
    s.is_valid(raise_exception=True)

    if SystemSetting.objects.filter(key=s.validated_data["key"].upper()).exists():
        return err("این کلید قبلاً ثبت شده است")

    setting = s.save()
    return ok(SystemSettingSerializer(setting).data, status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def setting_detail(request, pk):
    """
    GET    — جزئیات تنظیم
    PATCH  — به‌روزرسانی
    DELETE — حذف
    """
    # پشتیبانی از pk به عنوان UUID یا key
    try:
        setting = SystemSetting.objects.get(pk=pk)
    except (SystemSetting.DoesNotExist, Exception):
        setting = get_object_or_404(SystemSetting, key=str(pk).upper())

    if request.method == "GET":
        return ok(SystemSettingSerializer(setting).data)

    if request.method == "PATCH":
        s = SystemSettingUpdateSerializer(setting, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return ok(SystemSettingSerializer(setting).data)

    # DELETE
    key = setting.key
    setting.delete()
    return ok({"message": f"تنظیم {key} حذف شد"})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def bulk_update(request):
    """
    به‌روزرسانی دسته‌ای چند تنظیم.
    Body: [{"key": "...", "value": "..."}, ...]
    """
    updates = request.data if isinstance(request.data, list) else []
    if not updates:
        return err("آرایه‌ای از تنظیمات ارائه دهید")

    results = []
    for item in updates:
        key   = str(item.get("key", "")).upper()
        value = str(item.get("value", ""))
        if key:
            setting, _ = SystemSetting.objects.update_or_create(
                key=key,
                defaults={"value": value}
            )
            results.append({"key": key, "value": value, "id": str(setting.id)})

    return ok({"updated": len(results), "results": results})
