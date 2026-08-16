# apps/core/management/commands/import_users.py

import pandas as pd
from django.core.management.base import BaseCommand
from users.models import User, Profile


class Command(BaseCommand):
    help = 'وارد کردن کاربران از فایل اکسل'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='مسیر فایل اکسل')
        parser.add_argument('--force', action='store_true', help='آپدیت کاربران موجود')

    def handle(self, *args, **options):
        file_path = options['file']
        force = options['force']

        self.stdout.write(self.style.SUCCESS(f'👥 در حال خواندن کاربران از {file_path}'))

        try:
            xls = pd.ExcelFile(file_path)

            # Import Users
            if 'users' in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name='users').fillna('')
                count = 0
                for _, row in df.iterrows():
                    phone = str(row['phone_number']).strip()
                    if not phone:
                        continue

                    defaults = {
                        'email': str(row.get('email', f'{phone}@induservice.local')),
                        'first_name': str(row.get('first_name', '')),
                        'last_name': str(row.get('last_name', '')),
                        'role': str(row.get('role', 'buyer')),
                        'is_verified': bool(row.get('is_verified', False)),
                        'is_active': bool(row.get('is_active', True)),
                    }

                    if force:
                        user, created = User.objects.update_or_create(phone_number=phone, defaults=defaults)
                    else:
                        if User.objects.filter(phone_number=phone).exists():
                            continue
                        user = User.objects.create_user(phone_number=phone, **defaults)
                        created = True

                    # اگر رمز عبور در اکسل باشد
                    if row.get('password') and str(row['password']).strip():
                        user.set_password(str(row['password']))
                        user.save()

                    if created or force:
                        Profile.objects.get_or_create(user=user)
                        count += 1

                self.stdout.write(f'  👥 کاربران: {count} مورد')

            # Import Profiles
            if 'profiles' in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name='profiles').fillna('')
                count = 0
                for _, row in df.iterrows():
                    phone = str(row['phone_number']).strip()
                    if not phone:
                        continue
                    try:
                        user = User.objects.get(phone_number=phone)
                        profile, _ = Profile.objects.get_or_create(user=user)
                        
                        update_fields = ['company_name', 'city', 'bio', 'years_of_experience',
                                         'specializations', 'website', 'linkedin', 'instagram',
                                         'company_registration_number', 'tax_id', 'address', 'postal_code']
                        for field in update_fields:
                            if row.get(field):
                                setattr(profile, field, str(row[field]))
                        profile.save()
                        count += 1
                    except User.DoesNotExist:
                        pass

                self.stdout.write(f'  📋 پروفایل‌ها: {count} مورد')

            self.stdout.write(self.style.SUCCESS('✅ ایمپورت کاربران کامل شد!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ خطا: {e}'))