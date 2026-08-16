"""apps/system_setting/urls.py"""
from django.urls import path
from . import views

app_name = "system_setting"

urlpatterns = [
    path("",               views.setting_list_create, name="list-create"),
    path("public/",        views.public_settings,     name="public"),
    path("bulk/",          views.bulk_update,          name="bulk-update"),
    path("<str:pk>/",      views.setting_detail,       name="detail"),
]
