import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi'
import { useMyServices, useDeleteService } from '@features/services/hooks/useServices'
import { Spinner, Alert, Button, Card, ConfirmModal, Badge } from '@components/ui'
import { formatPrice } from '@lib/utils'
import { SERVICE_TYPE_LABELS, SERVICE_SCENARIOS } from '@lib/constants'

export default function MyServices() {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, service: null })
  const { data, isLoading, error } = useMyServices()
  const { mutate: deleteService, isPending: isDeleting } = useDeleteService()

  const services = data?.results || []

  const handleDelete = () => {
    if (deleteModal.service) {
      deleteService(deleteModal.service.slug, {
        onSuccess: () => setDeleteModal({ isOpen: false, service: null })
      })
    }
  }

  if (isLoading) return <div className="p-6"><Spinner size="lg" /></div>
  if (error) return <Alert variant="error">خطا در دریافت خدمات</Alert>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2">خدمات من</h1>
        <Link to="/dashboard/services/new">
          <Button variant="primary"><FiPlus className="ml-2" />خدمت جدید</Button>
        </Link>
      </div>

      {services.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-secondary-500 mb-4">شما هنوز خدمتی ثبت نکرده‌اید.</p>
          <Link to="/dashboard/services/new">
            <Button variant="primary">ثبت اولین خدمت</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right text-sm font-medium text-secondary-500">
                  <th className="pb-3">عنوان</th>
                  <th className="pb-3">سناریو</th>
                  <th className="pb-3">قیمت</th>
                  <th className="pb-3">وضعیت</th>
                  <th className="pb-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {services.map((service) => (
                  <tr key={service.id} className="text-sm">
                    <td className="py-3 font-medium">{service.title}</td>
                    <td className="py-3">{SERVICE_SCENARIOS[service.service_scenario] || '-'}</td>
                    <td className="py-3 text-primary-600">{service.base_price ? formatPrice(service.base_price) : 'استعلام'}</td>
                    <td className="py-3">
                      <Badge variant={service.is_active ? 'success' : 'secondary'}>
                        {service.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/services/${service.slug}`}><Button variant="ghost" size="sm"><FiEye /></Button></Link>
                        <Link to={`/dashboard/services/${service.slug}/edit`}><Button variant="ghost" size="sm"><FiEdit2 /></Button></Link>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteModal({ isOpen: true, service })}><FiTrash2 /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, service: null })}
        onConfirm={handleDelete}
        title="حذف خدمت"
        message={`آیا از حذف "${deleteModal.service?.title}" اطمینان دارید؟`}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}