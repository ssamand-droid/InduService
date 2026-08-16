import { Link } from 'react-router-dom'
import { FiTool, FiClock, FiMapPin } from 'react-icons/fi'
import { Card, Badge, Button } from '@components/ui'
import { SERVICE_SCENARIOS } from '@lib/constants'

// تابع امن فرمت قیمت با هزارگان
const safeFormatPrice = (price) => {
  if (!price && price !== 0) return 'استعلام قیمت'
  const num = Number(price)
  if (isNaN(num)) return 'استعلام قیمت'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + ' ریال'
}

export const ServiceCard = ({ service }) => {
  const {
    slug,
    title,
    service_scenario,
    pricing_model,
    base_price,
    hourly_rate,
    provider_name,
    service_area,
    estimated_duration_days,
    primary_image,
  } = service

  const getPriceDisplay = () => {
    if (pricing_model === 'fixed' && base_price) return safeFormatPrice(base_price)
    if (pricing_model === 'hourly' && hourly_rate) return `${safeFormatPrice(hourly_rate)} / ساعت`
    return 'استعلام قیمت'
  }

  return (
    <Card hoverable className="h-full flex flex-col">
      <Link to={`/services/${slug}`} className="block">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
          {primary_image ? (
            <img 
              src={primary_image} 
              alt={title} 
              className="h-full w-full object-cover" 
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FiTool className="h-12 w-12 text-blue-400" />
            </div>
          )}
          <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs bg-white/90">
            {SERVICE_SCENARIOS[service_scenario] || service_scenario || 'خدمت'}
          </Badge>
        </div>
      </Link>

      <div className="flex-1 mt-4">
        <Link to={`/services/${slug}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition">
            {title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-gray-500">{provider_name || 'ارائه‌دهنده'}</p>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiMapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{service_area || 'سراسر کشور'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiClock className="h-4 w-4 shrink-0" />
            <span>مدت زمان: {estimated_duration_days || '—'} روز</span>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-lg font-bold text-blue-600">
            {getPriceDisplay()}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Link to={`/services/${slug}`}>
          <Button variant="outline" fullWidth>مشاهده و درخواست</Button>
        </Link>
      </div>
    </Card>
  )
}