from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.db import transaction
from .models import User, Profile, PortfolioItem, Certification
from core.utils import to_jalali_datetime
from organizations.models import Organization, OrganizationMembership


class UserSerializer(serializers.ModelSerializer):
    """سریالایزر پایه کاربر - خروجی API"""
    full_name = serializers.CharField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    date_joined_jalali = serializers.SerializerMethodField()

    # 🆕 اطلاعات پروفایل که در هدر و سایدبار نیاز داریم
    person_type = serializers.CharField(source='profile.person_type', read_only=True, default='individual')
    company_name = serializers.CharField(source='profile.company_name', read_only=True, default='')
    buyer_sub_role = serializers.CharField(source='profile.buyer_sub_role', read_only=True, default='')
    provider_sub_role = serializers.CharField(source='profile.provider_sub_role', read_only=True, default='')

    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'is_verified', 'date_joined', 'date_joined_jalali',
            'person_type', 'company_name', 'buyer_sub_role', 'provider_sub_role',  # 🆕 حتماً اینجا باشد
        ]
        read_only_fields = ['id', 'is_verified', 'date_joined']

    def get_date_joined_jalali(self, obj):
        return to_jalali_datetime(obj.date_joined)


class RegisterSerializer(serializers.ModelSerializer):
    """
    سریالایزر ثبت‌نام با شماره موبایل
    - اعتبارسنجی شماره موبایل (یکتا، فرمت ۰۹)
    - تطابق رمز عبور و تکرار
    - ایجاد خودکار ایمیل در صورت عدم ارائه
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],  # ✅ اینجا هم باید تغییر کند
        style={'input_type': 'password'},
        help_text='حداقل ۶ کاراکتر',  # ✅ تغییر متن راهنما
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='تکرار رمز عبور',
    )

    class Meta:
        model = User
        fields = [
            'phone_number', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role',
            'person_type', 'subrole',
        ]
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        phone_number = validated_data.pop('phone_number')
        if not validated_data.get('email'):
            validated_data['email'] = f"{phone_number}@induservice.local"
        user = User.objects.create_user(phone_number=phone_number, **validated_data)
        return user

    # ========================
    # Validators
    # ========================

    def validate_phone_number(self, value):
        """اعتبارسنجی شماره موبایل ایرانی"""
        if not value.startswith('09') or len(value) != 11:
            raise serializers.ValidationError(
                "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود"
            )
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError(
                "این شماره موبایل قبلاً ثبت شده است"
            )
        return value

    def validate(self, attrs):
        """تطابق رمز عبور و تکرار"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password_confirm": "رمز عبور و تکرار آن یکسان نیستند."
            })
        return attrs

    # ========================
    # Create
    # ========================

    def create(self, validated_data):
        """ایجاد کاربر جدید - Profile توسط سیگنال ساخته می‌شود"""
        validated_data.pop('password_confirm')
        phone_number = validated_data.pop('phone_number')

        # اگر ایمیل ارائه نشده، یک ایمیل موقت بساز
        if not validated_data.get('email'):
            validated_data['email'] = f"{phone_number}@induservice.local"

        user = User.objects.create_user(phone_number=phone_number, **validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """سریالایزر تغییر رمز عبور"""
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'avatar', 'bio',
            'years_of_experience', 'specializations',
            'certificate_title', 'certificate_file',
            'rating', 'rating_count', 'completed_orders', 'total_revenue', 'avg_response_time_hours',
            'website', 'linkedin', 'instagram',
            'company_name', 'company_registration_number', 'tax_id',
            'address', 'city', 'postal_code',
            'bank_name', 'bank_account_number', 'bank_card_number', 'bank_shaba', 'bank_account_holder',
            # 🆕 جدید
            'service_types_offered', 'industries', 'machines',
            'manufacturing_processes', 'materials',
            'max_part_dimensions', 'precision_mm',
            'service_area_provinces', 'max_distance_km', 'response_time',
            'max_concurrent_requests', 'has_vehicle',
            'base_hourly_rate', 'base_daily_rate',
            'province',
        ]
        read_only_fields = ['id', 'user', 'rating', 'rating_count', 'completed_orders', 'total_revenue', 'avg_response_time_hours']

# apps/users/serializers.py - اضافه کردن RegisterStep1Serializer و RegisterStep2Serializer

# apps/users/serializers.py - چک کن RegisterStep1Serializer وجود دارد

class RegisterStep1Serializer(serializers.ModelSerializer):
    """مرحله اول ثبت‌نام: موبایل + رمز + انتخاب نقش"""
    role = serializers.ChoiceField(choices=[
        ('buyer', 'دریافت‌کننده خدمات'),
        ('provider', 'خدمات‌دهنده'),
    ])
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['phone_number', 'password', 'password_confirm', 'role']

    def validate_phone_number(self, value):
        if not value.startswith('09') or len(value) != 11:
            raise serializers.ValidationError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود")
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("این شماره موبایل قبلاً ثبت شده است")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "رمز عبور و تکرار آن یکسان نیستند."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        phone_number = validated_data.pop('phone_number')

        # 🆕 تبدیل role موقت به role واقعی
        if validated_data.get('role') == 'provider':
            validated_data['role'] = 'service_provider'  # پیش‌فرض حقیقی

        if not validated_data.get('email'):
            validated_data['email'] = f"{phone_number}@induservice.local"

        user = User.objects.create_user(phone_number=phone_number, **validated_data)
        return user


class RegisterStep2Serializer(serializers.Serializer):
    """مرحله دوم ثبت‌نام: تکمیل اطلاعات بر اساس نقش"""
    registration_token = serializers.CharField(write_only=True, required=True)

    # مشترک
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    person_type = serializers.ChoiceField(choices=[('individual', 'حقیقی'), ('legal', 'حقوقی')], default='individual')

    # حقیقی
    national_id = serializers.CharField(required=False, allow_blank=True)

    # دریافت‌کننده
    buyer_sub_role = serializers.CharField(required=False, allow_blank=True)  # متن آزاد

    # خدمات‌دهنده
    provider_sub_role = serializers.CharField(required=False, allow_blank=True)

    # حقوقی
    company_name = serializers.CharField(required=False, allow_blank=True)
    company_registration_number = serializers.CharField(required=False, allow_blank=True)
    tax_id = serializers.CharField(required=False, allow_blank=True)
    company_contacts = serializers.JSONField(required=False, default=list)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    province = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)

    def validate_registration_token(self, value):
        try:
            payload = signing.loads(value, salt='users.registration', max_age=30 * 60)
            user = User.objects.select_related('profile').get(pk=payload['user_id'])
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, KeyError, TypeError):
            raise serializers.ValidationError('اعتبار مرحله ثبت‌نام منقضی یا نامعتبر است. ثبت‌نام را دوباره آغاز کنید.')
        if user.profile.registration_completed:
            raise serializers.ValidationError('ثبت‌نام این حساب قبلاً تکمیل شده است.')
        return user

    def validate(self, attrs):
        if attrs['person_type'] == User.PersonType.LEGAL and not attrs.get('company_name', '').strip():
            raise serializers.ValidationError({'company_name': 'نام ثبتی شرکت یا کارخانه الزامی است.'})
        if attrs.get('company_contacts') and not isinstance(attrs['company_contacts'], list):
            raise serializers.ValidationError({'company_contacts': 'فهرست رابط‌ها باید آرایه باشد.'})
        return attrs

    def update(self, instance, validated_data):
        user = instance
        person_type = validated_data['person_type']
        role = user.role
        if role == User.Role.SERVICE_PROVIDER and person_type == User.PersonType.LEGAL:
            role = User.Role.COMPANY_PROVIDER
        elif role == User.Role.COMPANY_PROVIDER and person_type == User.PersonType.INDIVIDUAL:
            role = User.Role.SERVICE_PROVIDER

        with transaction.atomic():
            user.first_name = validated_data['first_name']
            user.last_name = validated_data['last_name']
            user.person_type = person_type
            user.role = role
            user.save(update_fields=['first_name', 'last_name', 'person_type', 'role', 'updated_at'])

            profile, _ = Profile.objects.get_or_create(user=user)
            profile.person_type = person_type
            for field in (
                'national_id', 'buyer_sub_role', 'provider_sub_role', 'company_name',
                'company_registration_number', 'tax_id', 'company_contacts',
                'address', 'city', 'province', 'postal_code', 'website',
            ):
                if field in validated_data:
                    setattr(profile, field, validated_data[field])
            profile.registration_completed = True
            profile.save()

            if person_type == User.PersonType.LEGAL:
                organization_type = (
                    Organization.Type.FACTORY if role == User.Role.BUYER
                    else Organization.Type.SERVICE_PROVIDER
                )
                organization, _ = Organization.objects.get_or_create(
                    created_by=user,
                    name=validated_data['company_name'].strip(),
                    organization_type=organization_type,
                    defaults={
                        'registration_number': validated_data.get('company_registration_number', '').strip(),
                        'tax_id': validated_data.get('tax_id', '').strip(),
                        'address': validated_data.get('address', '').strip(),
                        'city': validated_data.get('city', '').strip(),
                        'province': validated_data.get('province', '').strip(),
                        'postal_code': validated_data.get('postal_code', '').strip(),
                        'website': validated_data.get('website', '').strip(),
                    },
                )
                OrganizationMembership.objects.update_or_create(
                    organization=organization, user=user,
                    defaults={'role': OrganizationMembership.Role.OWNER, 'is_active': True},
                )
        return user
# 🆕 سریالایزرهای جدید
class PortfolioItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioItem
        fields = ['id', 'title', 'description', 'image', 'image_url', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class CertificationSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Certification
        fields = ['id', 'title', 'file', 'file_url', 'issued_by', 'verified', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None
