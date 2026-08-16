// src/pages/ServicesPage.jsx
import { ServiceList } from '@features/services/components/ServiceList'
import { SEO } from '@components/SEO'

export default function ServicesPage() {
  return (
    <>
      <SEO 
        title="خدمات تخصصی MRO | تعمیرات، نگهداری و اورهال | InduService"
        description="ارائه و درخواست خدمات تخصصی تعمیرات، نگهداری و اورهال تجهیزات صنعتی با بهترین کیفیت و قیمت"
        keywords="خدمات MRO, تعمیرات صنعتی, نگهداری پیشگیرانه, اورهال تجهیزات"
        url="https://induservice.pro/services"
        canonical="https://induservice.pro/services"
        schemaType="WebPage"
        breadcrumbItems={[
          { name: 'خانه', url: 'https://induservice.pro' },
          { name: 'خدمات', url: 'https://induservice.pro/services' },
        ]}
      />
      <div className="container-custom py-4">
        <ServiceList />
      </div>
    </>
  )
}