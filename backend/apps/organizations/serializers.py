from rest_framework import serializers

from .models import Organization, OrganizationMembership


class OrganizationSerializer(serializers.ModelSerializer):
    organization_type_display = serializers.CharField(source='get_organization_type_display', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'organization_type', 'organization_type_display',
            'registration_number', 'tax_id', 'website', 'address', 'city', 'province', 'postal_code',
            'verification_status', 'verification_status_display', 'my_role', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'verification_status', 'created_at', 'updated_at']

    def get_my_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user, is_active=True).first()
        return membership.role if membership else None

    def validate_organization_type(self, value):
        if self.instance and value != self.instance.organization_type:
            raise serializers.ValidationError('نوع سازمان پس از ثبت قابل تغییر نیست.')
        return value


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_type = serializers.CharField(source='organization.organization_type', read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = ['id', 'organization', 'organization_name', 'organization_type', 'role', 'is_active']
        read_only_fields = fields
