import pandas as pd
from django.core.management.base import BaseCommand
from products.models import Category, Brand, Product


class Command(BaseCommand):
    help = 'خروجی اکسل از محصولات، دسته‌بندی‌ها و برندها'

    def add_arguments(self, parser):
        parser.add_argument('output', type=str, help='مسیر فایل خروجی')

    def handle(self, *args, **options):
        output_path = options['output']

        # Export Categories
        categories = Category.objects.all().values('name', 'parent__name', 'description', 'is_active')
        df_cat = pd.DataFrame(list(categories))
        df_cat.rename(columns={'parent__name': 'parent'}, inplace=True)

        # Export Brands
        brands = Brand.objects.all().values('name', 'country', 'website', 'is_active')
        df_brand = pd.DataFrame(list(brands))

        # Export Products
        products = Product.objects.select_related('category', 'brand', 'seller').values(
            'name', 'category__name', 'brand__name', 'sku',
            'price', 'stock_quantity', 'product_type', 'condition',
            'description', 'short_description', 'is_active'
        )
        df_prod = pd.DataFrame(list(products))
        df_prod.rename(columns={'category__name': 'category', 'brand__name': 'brand'}, inplace=True)

        # Save
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df_cat.to_excel(writer, sheet_name='categories', index=False)
            df_brand.to_excel(writer, sheet_name='brands', index=False)
            df_prod.to_excel(writer, sheet_name='products', index=False)

        self.stdout.write(self.style.SUCCESS(
            f'✅ خروجی اکسل با موفقیت در {output_path} ذخیره شد!\n'
            f'   شیت‌ها: categories ({len(df_cat)}), brands ({len(df_brand)}), products ({len(df_prod)})'
        ))