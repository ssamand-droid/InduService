"""
سطوح دسترسی سفارشی برای پروژه
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    اجازه ویرایش فقط به مالک شیء
    """
    def has_object_permission(self, request, view, obj):
        # دسترسی خواندن برای همه (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # دسترسی نوشتن فقط برای مالک
        # اگر شیء user داشته باشد (مانند پروفایل)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # اگر خود شیء مدل User باشد
        return obj == request.user


class IsBuyer(permissions.BasePermission):
    """دسترسی فقط برای خریداران"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'buyer'


class IsSeller(permissions.BasePermission):
    """دسترسی فقط برای فروشندگان"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'seller'


class IsSeller(permissions.BasePermission):
    def has_permission(self, request, view):
        # service_provider هم باید بتونه محصول/خدمت ایجاد کنه
        return request.user.is_authenticated and request.user.role in ['seller', 'service_provider']


class IsAdmin(permissions.BasePermission):
    """دسترسی فقط برای مدیران"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.role == 'admin')