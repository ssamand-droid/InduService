// src/pages/ProductsPage.jsx
import { ProductList } from '@features/products/components/ProductList'
import { SEO } from '@components/SEO'

export default function ProductsPage() {
  return (
    <>
      <SEO 
        title="محصولات صنعتی | قطعات یدکی و تجهیزات MRO | InduService"
        description="خرید و فروش قطعات یدکی صنعتی، تجهیزات و مواد اولیه با بهترین قیمت و ضمانت اصالت"
        keywords="قطعات صنعتی, تجهیزات MRO, محصولات صنعتی, قطعات یدکی"
        url="https://induservice.pro/products"
        canonical="https://induservice.pro/products"
        schemaType="WebPage"
        breadcrumbItems={[
          { name: 'خانه', url: 'https://induservice.pro' },
          { name: 'محصولات', url: 'https://induservice.pro/products' },
        ]}
      />
      <div className="container-custom py-4">
        <ProductList />
      </div>
    </>
  )
}