# apps/core/management/commands/export_all.py

import pandas as pd
from django.core.management.base import BaseCommand
from users.models import User, Profile
from products.models import Category, Brand, Product
from services.models import ServiceCategory, Service, ServiceRequest
from orders.models import Order
from payment.models import Invoice
from blog.models import BlogCategory, BlogPost


class Command(BaseCommand):
    help = 'خروجی اکسل کامل از تمام داده‌ها'

    def add_arguments(self, parser):
        parser.add_argument('output', type=str, help='مسیر فایل خروجی')
        parser.add_argument('--tables', type=str, default='all', help='جداول مورد نظر (با کاما جدا کنید)')

    def handle(self, *args, **options):
        output_path = options['output']
        tables = options['tables'].split(',') if options['tables'] != 'all' else 'all'

        self.stdout.write(self.style.SUCCESS(f'📂 در حال خروجی کامل...'))

        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:

            # Users
            if tables == 'all' or 'users' in tables:
                users = User.objects.all().values('id', 'phone_number', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
                df = pd.DataFrame(list(users))
                if 'date_joined' in df.columns:
                    df['date_joined'] = pd.to_datetime(df['date_joined']).dt.tz_localize(None)
                df.to_excel(writer, sheet_name='users', index=False)
                self.stdout.write(f'  👥 users: {len(df)}')

                profiles = Profile.objects.all().values('user__phone_number', 'company_name', 'city', 'bio', 'rating', 'completed_orders', 'total_revenue')
                df = pd.DataFrame(list(profiles))
                df.rename(columns={'user__phone_number': 'phone_number'}, inplace=True)
                df.to_excel(writer, sheet_name='profiles', index=False)
                self.stdout.write(f'  📋 profiles: {len(df)}')

            # Products
            if tables == 'all' or 'products' in tables:
                categories = Category.objects.all().values('name', 'parent__name', 'description', 'is_active')
                df = pd.DataFrame(list(categories))
                df.rename(columns={'parent__name': 'parent'}, inplace=True)
                df.to_excel(writer, sheet_name='categories_products', index=False)
                self.stdout.write(f'  📦 categories_products: {len(df)}')

                brands = Brand.objects.all().values('name', 'country', 'website', 'is_active')
                df = pd.DataFrame(list(brands))
                df.to_excel(writer, sheet_name='brands', index=False)
                self.stdout.write(f'  🏷️ brands: {len(df)}')

                products = Product.objects.select_related('category', 'brand').values(
                    'name', 'category__name', 'brand__name', 'sku', 'price', 'stock_quantity', 'product_type', 'condition', 'description'
                )
                df = pd.DataFrame(list(products))
                df.rename(columns={'category__name': 'category', 'brand__name': 'brand'}, inplace=True)
                df.to_excel(writer, sheet_name='products', index=False)
                self.stdout.write(f'  📦 products: {len(df)}')

            # Services
            if tables == 'all' or 'services' in tables:
                svc_cat = ServiceCategory.objects.all().values('name', 'description', 'is_active')
                df = pd.DataFrame(list(svc_cat))
                df.to_excel(writer, sheet_name='categories_services', index=False)
                self.stdout.write(f'  🔧 categories_services: {len(df)}')

                services = Service.objects.select_related('category').values(
                    'title', 'category__name', 'service_type', 'service_scenario', 'pricing_model', 'base_price', 'description', 'is_active'
                )
                df = pd.DataFrame(list(services))
                df.rename(columns={'category__name': 'category', 'service_scenario': 'scenario'}, inplace=True)
                df.to_excel(writer, sheet_name='services', index=False)
                self.stdout.write(f'  🔧 services: {len(df)}')

                requests = ServiceRequest.objects.select_related('buyer', 'service').values(
                    'title', 'buyer__phone_number', 'service__title', 'status', 'quoted_price', 'created_at'
                )
                df = pd.DataFrame(list(requests))
                df.rename(columns={'buyer__phone_number': 'buyer', 'service__title': 'service'}, inplace=True)
                if 'created_at' in df.columns:
                    df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)
                df.to_excel(writer, sheet_name='service_requests', index=False)
                self.stdout.write(f'  📝 service_requests: {len(df)}')

            # Orders
            if tables == 'all' or 'orders' in tables:
                orders = Order.objects.select_related('buyer', 'seller').values(
                    'order_number', 'buyer__phone_number', 'seller__phone_number', 'status', 'payment_status', 'total', 'created_at'
                )
                df = pd.DataFrame(list(orders))
                df.rename(columns={'buyer__phone_number': 'buyer', 'seller__phone_number': 'seller'}, inplace=True)
                if 'created_at' in df.columns:
                    df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)
                df.to_excel(writer, sheet_name='orders', index=False)
                self.stdout.write(f'  🛒 orders: {len(df)}')

            # Finance
            if tables == 'all' or 'finance' in tables:
                invoices = Invoice.objects.select_related('buyer', 'seller').values(
                    'invoice_number', 'buyer__phone_number', 'seller__phone_number', 'status', 'total', 'platform_commission_amount', 'paid_at'
                )
                df = pd.DataFrame(list(invoices))
                df.rename(columns={'buyer__phone_number': 'buyer', 'seller__phone_number': 'seller'}, inplace=True)
                if 'paid_at' in df.columns:
                    df['paid_at'] = pd.to_datetime(df['paid_at']).dt.tz_localize(None)
                df.to_excel(writer, sheet_name='invoices', index=False)
                self.stdout.write(f'  💰 invoices: {len(df)}')

            # Blog
            if tables == 'all' or 'blog' in tables:
                blog_cat = BlogCategory.objects.all().values('name', 'description', 'icon', 'is_active')
                df = pd.DataFrame(list(blog_cat))
                df.to_excel(writer, sheet_name='blog_categories', index=False)
                self.stdout.write(f'  📝 blog_categories: {len(df)}')

                posts = BlogPost.objects.select_related('category').values(
                    'title', 'category__name', 'status', 'view_count', 'read_time', 'is_featured', 'published_at'
                )
                df = pd.DataFrame(list(posts))
                df.rename(columns={'category__name': 'category'}, inplace=True)
                if 'published_at' in df.columns:
                    df['published_at'] = pd.to_datetime(df['published_at']).dt.tz_localize(None)
                df.to_excel(writer, sheet_name='blog_posts', index=False)
                self.stdout.write(f'  📝 blog_posts: {len(df)}')

        self.stdout.write(self.style.SUCCESS(f'\n✅ خروجی کامل در {output_path} ذخیره شد!'))