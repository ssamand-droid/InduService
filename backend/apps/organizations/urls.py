from rest_framework.routers import DefaultRouter

from .views import OrganizationMembershipViewSet, OrganizationViewSet

router = DefaultRouter()
router.register('organizations', OrganizationViewSet, basename='organization')
router.register('organization-memberships', OrganizationMembershipViewSet, basename='organization-membership')

urlpatterns = router.urls
