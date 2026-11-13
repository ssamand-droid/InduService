from .models import OrganizationMembership


def get_membership(user, organization):
    if not user or not user.is_authenticated or organization is None:
        return None
    return OrganizationMembership.objects.filter(
        user=user, organization=organization, is_active=True,
    ).first()


def user_can_request(user, organization):
    membership = get_membership(user, organization)
    return bool(membership and membership.can_request)


def user_can_approve(user, organization):
    membership = get_membership(user, organization)
    return bool(membership and membership.can_approve)


def user_can_manage(user, organization):
    membership = get_membership(user, organization)
    return bool(membership and membership.can_manage)
