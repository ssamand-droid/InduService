# apps/core/management/commands/export_users.py

import pandas as pd
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'خروجی اکسل از کاربران'

    def add_arguments(self, parser):
        parser.add_argument('output', type=str, help='مسیر فایل خروجی')

    def handle(self, *args, **options):
        output_path = options['output']

        users = User.objects.all().values(
            'id', 'phone_number', 'email', 'first_name', 'last_name',
            'role', 'is_verified', 'is_active', 'is_staff',
            'date_joined', 'last_login'
        )
        df_users = pd.DataFrame(list(users))

        # تبدیل تاریخ‌ها
        if 'date_joined' in df_users.columns:
            df_users['date_joined'] = pd.to_datetime(df_users['date_joined']).dt.tz_localize(None)
        if 'last_login' in df_users.columns:
            df_users['last_login'] = pd.to_datetime(df_users['last_login']).dt.tz_localize(None)

        # Export Profiles
        from users.models import Profile
        profiles = Profile.objects.all().values(
            'user__phone_number', 'company_name', 'city', 'bio',
            'years_of_experience', 'specializations',
            'rating', 'completed_orders', 'total_revenue',
            'website', 'linkedin', 'instagram',
            'company_registration_number', 'tax_id',
            'address', 'postal_code'
        )
        df_profiles = pd.DataFrame(list(profiles))
        df_profiles.rename(columns={'user__phone_number': 'phone_number'}, inplace=True)

        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df_users.to_excel(writer, sheet_name='users', index=False)
            df_profiles.to_excel(writer, sheet_name='profiles', index=False)

        self.stdout.write(self.style.SUCCESS(
            f'✅ خروجی کاربران در {output_path} ذخیره شد!\n'
            f'   👥 users: {len(df_users)} کاربر\n'
            f'   📋 profiles: {len(df_profiles)} پروفایل'
        ))