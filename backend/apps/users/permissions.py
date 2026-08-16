from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    اجازه ویرایش فقط به مالک شیء
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # اگر شیء user داشته باشد (مانند پروفایل)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # اگر خود شیء مدل User باشد
        return obj == request.user

class IsBuyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'buyer'

class IsSeller(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'seller'

class IsServiceProvider(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'service_provider'