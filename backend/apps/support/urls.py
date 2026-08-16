"""apps/support/urls.py"""
from django.urls import path
from . import views

app_name = "support"

urlpatterns = [
    # ── تیکت‌ها (کاربر) ─────────────────────────────────────────────────────
    path("tickets/",               views.ticket_list_create, name="ticket-list-create"),
    path("tickets/<uuid:pk>/",     views.ticket_detail,      name="ticket-detail"),
    path("tickets/<uuid:pk>/close/",    views.ticket_close,   name="ticket-close"),
    path("tickets/<uuid:pk>/messages/", views.ticket_messages, name="ticket-messages"),

    # ── ادمین ───────────────────────────────────────────────────────────────
    path("admin/tickets/",         views.admin_ticket_list,  name="admin-ticket-list"),

    # ── اختلاف ──────────────────────────────────────────────────────────────
    path("disputes/",              views.dispute_create,     name="dispute-create"),
    path("disputes/<uuid:pk>/",    views.dispute_detail,     name="dispute-detail"),
]
