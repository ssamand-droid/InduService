// src/pages/ServiceDetailPage.jsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiTool, FiClock, FiMapPin, FiShield, FiUser, FiPhone, FiArrowRight } from 'react-icons/fi'
import { useService } from '@features/services/hooks/useServices'
import { ServiceRequestForm } from '@features/services/components/ServiceRequestForm'
import { Spinner, Alert, Button, Badge, Card, Modal, Tabs, TabList, Tab, TabPanels, TabPanel } from '@components/ui'
import { SEO } from '@components/SEO'
import { SERVICE_TYPE_LABELS } from '@lib/constants'
import { WorkflowPreview } from '@features/services/components/WorkflowPreview'

const safeFormatPrice = (price) => {
  if (!price && price !== 0) return '۰ ریال'
  const num = Number(price)
  if (isNaN(num)) return '۰ ریال'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + ' ریال'
}

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const { data: service, isLoading, error } = useService(slug)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
  
  if (error || !service) return (
    <div className="container-custom py-8">
      <Alert variant="error">خطا در دریافت اطلاعات خدمت</Alert>
    </div>
  )

  // ===== داده‌های سئو =====
  const seoData = {
    title: service.meta_title || `${service.title} | خدمات تخصصی MRO | InduService`,
    description: service.meta_description || `درخواست و دریافت ${service.title} با بهترین قیمت و کیفیت. خدمات تخصصی MRO و تعمیرات صنعتی در InduService`,
    keywords: service.meta_keywords || `${service.title}, خدمت صنعتی, ${service.category?.name || ''}, تعمیرات, نگهداری`,
    image: service.images?.[0]?.image || '/logo.png',
    url: `https://induservice.pro/services/${slug}`,
    canonical: `https://induservice.pro/services/${slug}`,
    publishedTime: service.created_at,
    modifiedTime: service.updated_at,
    schemaType: 'Service',
    serviceData: {
      service_type: service.service_type,
      base_price: service.base_price,
      hourly_rate: service.hourly_rate,
      provider_name: service.provider_name,
      service_area: service.service_area,
    },
    breadcrumbItems: [
      { name: 'خانه', url: 'https://induservice.pro' },
      { name: 'خدمات', url: 'https://induservice.pro/services' },
      { name: service.category?.name || 'دسته‌بندی', url: service.category ? `https://induservice.pro/services?category=${service.category.slug}` : '' },
      { name: service.title, url: `https://induservice.pro/services/${slug}` },
    ],
  }

  const getPriceDisplay = () => {
    if (service.pricing_model === 'fixed' && service.base_price) {
      return safeFormatPrice(service.base_price)
    } else if (service.pricing_model === 'hourly' && service.hourly_rate) {
      return `${safeFormatPrice(service.hourly_rate)} / ساعت`
    }
    return 'استعلام قیمت'
  }

  return (
    <>
      <SEO {...seoData} />

      {/* ===== بردکرامب ===== */}
      <div className="container-custom pt-4" itemScope itemType="https://schema.org/BreadcrumbList">
        <div className="flex items-center gap-2 text-sm text-secondary-500">
          <Link to="/" itemProp="item" itemScope itemType="https://schema.org/Thing">
            <span itemProp="name">خانه</span>
            <meta itemProp="position" content="1" />
          </Link>
          <FiArrowRight className="h-4 w-4" />
          <Link to="/services" itemProp="item" itemScope itemType="https://schema.org/Thing">
            <span itemProp="name">خدمات</span>
            <meta itemProp="position" content="2" />
          </Link>
          {service.category && (
            <>
              <FiArrowRight className="h-4 w-4" />
              <Link to={`/services?category=${service.category.slug}`} itemProp="item" itemScope itemType="https://schema.org/Thing">
                <span itemProp="name">{service.category.name}</span>
                <meta itemProp="position" content="3" />
              </Link>
            </>
          )}
        </div>
      </div>
      
      <div className="container-custom py-6 px-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* ستون اصلی - توضیحات */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-4 md:p-6">
                <div className="mb-4">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{service.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="primary">{SERVICE_TYPE_LABELS[service.service_type]}</Badge>
                    <span className="text-sm text-gray-500">
                      ارائه‌دهنده: {service.provider_name || '---'}
                    </span>
                  </div>
                </div>

                <Tabs defaultIndex={0}>
                  <TabList>
                    <Tab index={0}>توضیحات</Tab>
                    <Tab index={1}>شرایط</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <div className="mt-4">
                        <p className="text-gray-700 whitespace-pre-line break-words">
                          {service.description}
                        </p>
                      </div>
                    </TabPanel>
                    <TabPanel>
                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">پیش‌نیازها</h4>
                          <p className="text-gray-600">{service.requirements || 'پیش‌نیاز خاصی ذکر نشده است.'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">گارانتی</h4>
                          <p className="text-gray-600">{service.warranty_months} ماه</p>
                        </div>
                      </div>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </div>
            </Card>
          </div>

          {/* ستون کناری - اطلاعات و قیمت */}
          <div className="space-y-6">
            <Card>
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-gray-600">قیمت:</span>
                  <span className="text-xl md:text-2xl font-bold text-blue-600">{getPriceDisplay()}</span>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiClock className="h-5 w-5 shrink-0" />
                    <span className="text-sm">مدت زمان تقریبی: {service.estimated_duration_days} روز</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiMapPin className="h-5 w-5 shrink-0" />
                    <span className="text-sm">محدوده: {service.service_area || 'سراسر کشور'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiShield className="h-5 w-5 shrink-0" />
                    <span className="text-sm">گارانتی: {service.warranty_months} ماه</span>
                  </div>
                </div>
                
                {service.service_scenario && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2 text-gray-700">
                      📋 مراحل پیش‌بینی شده برای این خدمت:
                    </p>
                    <WorkflowPreview scenario={service.service_scenario} />
                  </div>
                )}
                
                <Button 
                  variant="primary" 
                  fullWidth 
                  size="lg" 
                  onClick={() => setIsRequestModalOpen(true)}
                  className="mt-2"
                >
                  ثبت درخواست خدمت
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <Modal 
          isOpen={isRequestModalOpen} 
          onClose={() => setIsRequestModalOpen(false)} 
          title="ثبت درخواست خدمت" 
          size="lg"
        >
          <ServiceRequestForm
            serviceId={service.id}
            serviceTitle={service.title}
            onSuccess={() => setIsRequestModalOpen(false)}
          />
        </Modal>
      </div>
    </>
  )
}