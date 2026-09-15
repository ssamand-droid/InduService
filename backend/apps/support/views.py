# apps/support/views.py
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Ticket, TicketMessage, TicketStatus, Dispute
from .serializers import (
    TicketListSerializer, TicketDetailSerializer,
    TicketCreateSerializer, TicketUpdateSerializer,
    TicketMessageSerializer, TicketMessageCreateSerializer,
    DisputeSerializer, DisputeResolveSerializer,
)

# ============================================================
# کامنت کردن import های notification
# ============================================================
# from apps.notification.services import create_notification  # ← کامنت کنید
# from apps.users.models import User  # ← کامنت کنید


def ok(data, code=status.HTTP_200_OK):
    return Response({"success": True, "data": data}, status=code)


def err(msg, code=status.HTTP_400_BAD_REQUEST):
    return Response({"success": False, "message": msg}, status=code)


def paginated(queryset, serializer_class, request, extra_kwargs=None):
    """ساده‌ترین pagination برای این پروژه."""
    page      = int(request.query_params.get("page", 1))
    page_size = int(request.query_params.get("page_size", 20))
    start     = (page - 1) * page_size
    end       = start + page_size
    total     = queryset.count()
    items     = queryset[start:end]
    kwargs    = {"many": True, **(extra_kwargs or {})}
    data      = serializer_class(items, **kwargs).data
    return Response({
        "success": True,
        "count":    total,
        "next":     None if end >= total else f"?page={page + 1}",
        "previous": None if page <= 1    else f"?page={page - 1}",
        "results":  data,
    })


# ── تیکت‌ها (کاربر عادی) ─────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def ticket_list_create(request):
    """
    GET  — لیست تیکت‌های خود کاربر
    POST — ایجاد تیکت جدید
    """
    if request.method == "GET":
        qs = Ticket.objects.filter(user=request.user)

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        priority_filter = request.query_params.get("priority")
        if priority_filter:
            qs = qs.filter(priority=priority_filter)

        return paginated(qs, TicketListSerializer, request)

    # POST
    s = TicketCreateSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    ticket = s.save(user=request.user)

    # ============================================================
    # کامنت کردن اعلان‌ها
    # ============================================================
    # _notify_admins_new_ticket(ticket)  # ← کامنت کنید

    # create_notification(  # ← کامنت کنید
    #     user=request.user,
    #     type='system',
    #     title='✅ تیکت شما ثبت شد',
    #     message=f'تیکت "{ticket.subject}" با موفقیت ثبت شد. منتظر پاسخ تیم پشتیبانی باشید.',
    #     link=f'/dashboard/support/tickets/{ticket.id}',
    #     extra_data={'ticket_id': str(ticket.id)}
    # )

    return ok(TicketDetailSerializer(ticket).data, status.HTTP_201_CREATED)


# apps/support/views.py - بخش ticket_detail

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def ticket_detail(request, pk):
    """
    GET   — جزئیات تیکت (شامل body و توضیحات کامل)
    PATCH — ادمین: تغییر وضعیت / اختصاص
    """
    # ادمین می‌تواند همه را ببیند
    if request.user.is_staff:
        ticket = get_object_or_404(Ticket, pk=pk)
    else:
        ticket = get_object_or_404(Ticket, pk=pk, user=request.user)

    if request.method == "GET":
        # ✅ استفاده از TicketDetailSerializer که شامل body است
        serializer = TicketDetailSerializer(ticket)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # PATCH — فقط ادمین
    if not request.user.is_staff:
        return err("دسترسی ندارید", status.HTTP_403_FORBIDDEN)

    s = TicketUpdateSerializer(ticket, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()

    # ✅ بعد از ویرایش هم TicketDetailSerializer برگردان
    serializer = TicketDetailSerializer(ticket)
    return Response({
        "success": True,
        "data": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ticket_close(request, pk):
    """کاربر تیکت خود را می‌بندد."""
    ticket = get_object_or_404(Ticket, pk=pk, user=request.user)
    if ticket.status in (TicketStatus.CLOSED, TicketStatus.RESOLVED):
        return err("این تیکت قبلاً بسته شده است")
    ticket.close()
    return ok({"message": "تیکت بسته شد"})


# ── پیام‌های تیکت ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def ticket_messages(request, pk):
    """
    GET  — لیست پیام‌های تیکت
    POST — ارسال پیام جدید
    """
    # ادمین همه را می‌بیند
    if request.user.is_staff:
        ticket = get_object_or_404(Ticket, pk=pk)
    else:
        ticket = get_object_or_404(Ticket, pk=pk, user=request.user)

    if request.method == "GET":
        msgs = ticket.messages.select_related("sender").all()
        return Response({
            "success": True,
            "count":   msgs.count(),
            "results": TicketMessageSerializer(msgs, many=True).data,
        })

    # POST — بررسی بسته نبودن (فقط برای کاربر عادی)
    if not request.user.is_staff and ticket.status == TicketStatus.CLOSED:
        return err("این تیکت بسته شده است. امکان ارسال پیام وجود ندارد.")

    s = TicketMessageCreateSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    msg = s.save(ticket=ticket, sender=request.user)

    # ============================================================
    # کامنت کردن اعلان‌ها
    # ============================================================
    # if request.user.is_staff:  # ← کامنت کنید
    #     create_notification(
    #         user=ticket.user,
    #         type='system',
    #         title='💬 پاسخ جدید از پشتیبانی',
    #         message=f'ادمین به تیکت "{ticket.subject}" پاسخ داد.',
    #         link=f'/dashboard/support/tickets/{ticket.id}',
    #         extra_data={'ticket_id': str(ticket.id), 'message_id': str(msg.id)}
    #     )
    # else:
    #     _notify_admins_new_message(ticket, msg)

    # اگر ادمین پاسخ داد، وضعیت را به in_review تغییر بده
    if request.user.is_staff and ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_REVIEW
        ticket.save(update_fields=["status", "updated_at"])

    return ok(TicketMessageSerializer(msg).data, status.HTTP_201_CREATED)


# ── ادمین: مشاهده همه تیکت‌ها ────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_ticket_list(request):
    """ادمین: لیست همه تیکت‌ها با فیلتر."""
    qs = Ticket.objects.select_related("user", "assigned_to").all()

    status_filter   = request.query_params.get("status")
    priority_filter = request.query_params.get("priority")
    category_filter = request.query_params.get("category")
    search          = request.query_params.get("search")

    if status_filter:
        qs = qs.filter(status=status_filter)
    if priority_filter:
        qs = qs.filter(priority=priority_filter)
    if category_filter:
        qs = qs.filter(category=category_filter)
    if search:
        qs = qs.filter(
            Q(subject__icontains=search) |
            Q(user__phone_number__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search)
        )

    return paginated(qs, TicketListSerializer, request)


# ── اختلاف (Dispute) ─────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dispute_create(request):
    """ایجاد اختلاف برای یک سفارش."""
    s = DisputeSerializer(data=request.data)
    s.is_valid(raise_exception=True)

    order = s.validated_data["order"]

    # فقط طرفین سفارش
    if request.user not in (order.buyer, order.provider):
        return err("شما در این سفارش شرکت نداشتید", status.HTTP_403_FORBIDDEN)

    # جلوگیری از اختلاف تکراری
    if Dispute.objects.filter(order=order).exists():
        return err("برای این سفارش قبلاً اختلاف ثبت شده است")

    dispute = s.save(raised_by=request.user)

    # تغییر وضعیت سفارش به disputed
    try:
        order.transition("disputed")
    except Exception:
        pass

    return ok(DisputeSerializer(dispute).data, status.HTTP_201_CREATED)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def dispute_detail(request, pk):
    dispute = get_object_or_404(Dispute, pk=pk)

    # فقط طرفین سفارش یا ادمین
    order = dispute.order
    if not request.user.is_staff and request.user not in (order.buyer, order.provider):
        return err("دسترسی ندارید", status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return ok(DisputeSerializer(dispute).data)

    # PATCH — فقط ادمین می‌تواند حل کند
    if not request.user.is_staff:
        return err("دسترسی ندارید", status.HTTP_403_FORBIDDEN)

    s = DisputeResolveSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    dispute.resolve(s.validated_data["resolution"], s.validated_data.get("note", ""))

    # آزادسازی یا بازگشت وجه بر اساس نتیجه
    _handle_dispute_resolution(dispute)

    return ok(DisputeSerializer(dispute).data)


# ── توابع کمکی ───────────────────────────────────────────────────────────────

# ============================================================
# کامنت کردن توابع کمکی
# ============================================================
# def _notify_admins_new_ticket(ticket):
#     """اعلان به ادمین‌ها وقتی تیکت جدید ثبت می‌شود."""
#     admins = User.objects.filter(is_staff=True)
#     for admin in admins:
#         create_notification(
#             user=admin,
#             type='system',
#             title='📩 تیکت جدید',
#             message=f'کاربر {ticket.user_phone} تیکت "{ticket.subject}" ثبت کرد.',
#             link=f'/dashboard/admin/support/tickets/{ticket.id}',
#             extra_data={'ticket_id': str(ticket.id)}
#         )


# def _notify_admins_ticket_closed(ticket):
#     """اعلان به ادمین‌ها وقتی تیکت بسته می‌شود."""
#     admins = User.objects.filter(is_staff=True)
#     for admin in admins:
#         create_notification(
#             user=admin,
#             type='system',
#             title='🔒 تیکت بسته شد',
#             message=f'کاربر {ticket.user_phone} تیکت "{ticket.subject}" را بست.',
#             link=f'/dashboard/admin/support/tickets/{ticket.id}',
#             extra_data={'ticket_id': str(ticket.id)}
#         )


# def _notify_admins_new_message(ticket, message):
#     """اعلان به ادمین‌ها وقتی کاربر پیام جدید ارسال می‌کند."""
#     admins = User.objects.filter(is_staff=True)
#     for admin in admins:
#         create_notification(
#             user=admin,
#             type='system',
#             title='💬 پیام جدید در تیکت',
#             message=f'کاربر {ticket.user_phone} در تیکت "{ticket.subject}" پیام جدید ارسال کرد.',
#             link=f'/dashboard/admin/support/tickets/{ticket.id}',
#             extra_data={'ticket_id': str(ticket.id), 'message_id': str(message.id)}
#         )


# def _notify_admins_new_dispute(dispute):
#     """اعلان به ادمین‌ها وقتی اختلاف جدید ثبت می‌شود."""
#     admins = User.objects.filter(is_staff=True)
#     for admin in admins:
#         create_notification(
#             user=admin,
#             type='system',
#             title='⚖️ اختلاف جدید',
#             message=f'اختلاف جدید برای سفارش #{dispute.order.id} ثبت شد.',
#             link=f'/dashboard/admin/disputes/{dispute.id}',
#             extra_data={'dispute_id': str(dispute.id), 'order_id': str(dispute.order.id)}
#         )


def _handle_dispute_resolution(dispute):
    """پردازش مالی پس از حل اختلاف."""
    try:
        if dispute.resolution == "to_provider":
            from apps.payment.services import release_escrow
            release_escrow(dispute.order)
        elif dispute.resolution == "to_buyer":
            from apps.payment.services import refund_escrow
            refund_escrow(dispute.order)
    except Exception:
        pass