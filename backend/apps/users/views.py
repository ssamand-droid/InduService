from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.core import signing
from drf_spectacular.utils import extend_schema
from django.contrib.auth import get_user_model
from .models import Profile, PortfolioItem, Certification
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer, ProfileSerializer,
    PortfolioItemSerializer, CertificationSerializer, RegisterStep1Serializer, RegisterStep2Serializer
)
from core.permissions import IsOwnerOrReadOnly
from organizations.serializers import OrganizationMembershipSerializer

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        permission_map = {
            'register': [permissions.AllowAny()],
            'me': [permissions.IsAuthenticated()],
            'profile': [permissions.IsAuthenticated()],
            'change_password': [permissions.IsAuthenticated()],
            'upload_avatar': [permissions.IsAuthenticated()],
        }
        if self.action in permission_map:
            return permission_map[self.action]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    # ========================
    # GET /api/users/me/
    # ========================
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        data = UserSerializer(user).data
        data['profile'] = ProfileSerializer(user.profile).data
        data['organization_memberships'] = OrganizationMembershipSerializer(
            user.organization_memberships.filter(is_active=True).select_related('organization'), many=True,
        ).data
        data['role_display'] = user.get_role_display()
        return Response(data)

    # ========================
    # POST /api/users/register/
    # ========================
    @extend_schema(
        description='مرحله اول ثبت‌نام: موبایل + رمز + نقش',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'phone_number': {'type': 'string', 'example': '09120001122'},
                    'password': {'type': 'string', 'format': 'password', 'example': 'Test1234!'},
                    'password_confirm': {'type': 'string', 'format': 'password', 'example': 'Test1234!'},
                    'role': {'type': 'string', 'example': 'buyer', 'enum': ['buyer', 'service_provider']},
                },
                'required': ['phone_number', 'password', 'password_confirm', 'role']
            }
        },
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'user_id': {'type': 'integer'},
                    'registration_token': {'type': 'string'},
                    'role': {'type': 'string'},
                }
            }
        },
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register_step1(self, request):
        """مرحله اول ثبت‌نام: موبایل + رمز + نقش"""
        serializer = RegisterStep1Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'مرحله اول با موفقیت انجام شد',
            'user_id': user.id,
            'registration_token': signing.dumps({'user_id': user.id}, salt='users.registration'),
            'role': user.role,
        }, status=status.HTTP_201_CREATED)

    @extend_schema(
        description='مرحله دوم ثبت‌نام: تکمیل پروفایل',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'registration_token': {'type': 'string'},
                    'first_name': {'type': 'string', 'example': 'رضا'},
                    'last_name': {'type': 'string', 'example': 'محمدی'},
                    'person_type': {'type': 'string', 'enum': ['individual', 'legal'], 'example': 'individual'},
                    'national_id': {'type': 'string', 'nullable': True},
                    'buyer_sub_role': {'type': 'string', 'nullable': True},
                    'provider_sub_role': {'type': 'string', 'nullable': True},
                    'company_name': {'type': 'string', 'nullable': True},
                    'company_registration_number': {'type': 'string', 'nullable': True},
                    'tax_id': {'type': 'string', 'nullable': True},
                    'company_contacts': {'type': 'array', 'items': {'type': 'object'}},
                    'address': {'type': 'string'},
                    'city': {'type': 'string'},
                    'province': {'type': 'string'},
                    'postal_code': {'type': 'string'},
                    'website': {'type': 'string'},
                },
                'required': ['registration_token', 'first_name', 'last_name', 'person_type']
            }
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'user': {'type': 'object'},
                }
            }
        },
    )

    @extend_schema(
        description='مرحله دوم ثبت‌نام: تکمیل پروفایل',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'registration_token': {'type': 'string'},
                    'first_name': {'type': 'string', 'example': 'رضا'},
                    'last_name': {'type': 'string', 'example': 'محمدی'},
                    'person_type': {'type': 'string', 'enum': ['individual', 'legal'], 'example': 'individual'},
                    'national_id': {'type': 'string', 'nullable': True},
                    'buyer_sub_role': {'type': 'string', 'nullable': True},
                    'provider_sub_role': {'type': 'string', 'nullable': True},
                    'company_name': {'type': 'string', 'nullable': True},
                    'company_registration_number': {'type': 'string', 'nullable': True},
                    'tax_id': {'type': 'string', 'nullable': True},
                    'company_contacts': {'type': 'array', 'items': {'type': 'object'}},
                    'address': {'type': 'string'},
                    'city': {'type': 'string'},
                    'province': {'type': 'string'},
                    'postal_code': {'type': 'string'},
                    'website': {'type': 'string'},
                },
                'required': ['registration_token', 'first_name', 'last_name', 'person_type']
            }
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'user': {'type': 'object'},
                }
            }
        },
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register_step2(self, request):
        """مرحله دوم ثبت‌نام: تکمیل پروفایل"""
        serializer = RegisterStep2Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data.pop('registration_token')
        user = serializer.update(user, serializer.validated_data)

        return Response({
            'success': True,
            'message': 'ثبت‌نام با موفقیت تکمیل شد',
            'user': UserSerializer(user).data,
        })
    # ========================
    # PATCH /api/users/profile/
    # ========================
    @extend_schema(
        description='دریافت و بروزرسانی پروفایل کاربر',
        request=ProfileSerializer,
        responses={200: ProfileSerializer},
    )
    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        profile = request.user.profile
        if request.method == 'GET':
            return Response(ProfileSerializer(profile).data)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'پروفایل بروزرسانی شد.',
            'data': serializer.data,
        })

    # ========================
    # POST /api/users/change_password/
    # ========================
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'success': False, 'error': 'رمز عبور فعلی نادرست است.'}, status=400)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'success': True, 'message': 'رمز عبور با موفقیت تغییر کرد.'})

    # ========================
    # *** جعل هویت ***
    # ========================
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def impersonate(self, request, pk=None):
        """ادمین: جعل هویت کاربر"""
        target_user = self.get_object()

        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(target_user)

        return Response({
            'success': True,
            'message': f'وارد حساب {target_user.full_name} شدید',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(target_user).data,
            'impersonated': True,
            'admin_id': request.user.id,
        })

    # ========================
    # POST /api/users/upload_avatar/
    # ========================
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_avatar(self, request):
        profile = request.user.profile
        if 'avatar' not in request.FILES:
            return Response({'success': False, 'error': 'فایلی آپلود نشده'}, status=400)

        profile.avatar = request.FILES['avatar']
        profile.save(update_fields=['avatar'])

        return Response({
            'success': True,
            'message': 'تصویر پروفایل با موفقیت آپلود شد',
            'avatar': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        })


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.select_related('user').all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]

class PortfolioItemViewSet(viewsets.ModelViewSet):
    """نمونه کارهای کاربر"""
    serializer_class = PortfolioItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PortfolioItem.objects.all()
        # کاربران دیگر فقط نمونه کارهای عمومی را ببینند
        return PortfolioItem.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CertificationViewSet(viewsets.ModelViewSet):
    """مدارک و گواهینامه‌های کاربر"""
    serializer_class = CertificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Certification.objects.all()
        return Certification.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
