from django.db import transaction
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Organization, OrganizationMembership
from .permissions import user_can_manage
from .serializers import OrganizationMembershipSerializer, OrganizationSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'put', 'head', 'options']

    def get_queryset(self):
        return Organization.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True,
        ).distinct()

    @transaction.atomic
    def perform_create(self, serializer):
        organization = serializer.save(created_by=self.request.user)
        OrganizationMembership.objects.create(
            organization=organization, user=self.request.user, role=OrganizationMembership.Role.OWNER,
        )

    def update(self, request, *args, **kwargs):
        organization = self.get_object()
        if not user_can_manage(request.user, organization):
            raise PermissionDenied('برای ویرایش اطلاعات سازمان باید مالک یا مدیر سازمان باشید.')
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class OrganizationMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrganizationMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OrganizationMembership.objects.filter(
            user=self.request.user, is_active=True,
        ).select_related('organization')
