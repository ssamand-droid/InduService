// InduService\frontend\src\features\services\components\ServiceRequestUpdateForm.jsx
import { useState } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import { Button, Modal } from '@components/ui'
import { serviceApi } from '@features/services/services/serviceApi'
import toast from 'react-hot-toast'

/**
 * فرم ویرایش درخواست خدمت (فقط در حالت PENDING)
 * @param {boolean} isOpen - وضعیت باز بودن
 * @param {function} onClose - بستن modal
 * @param {object} request - داده‌های درخواست
 * @param {function} onUpdate - callback بعد از ویرایش موفق
 */
export const ServiceRequestUpdateForm = ({ isOpen, onClose, request, onUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(request?.title || '')
  const [description, setDescription] = useState(request?.description || '')
  const [equipmentDetails, setEquipmentDetails] = useState(request?.equipment_details || '')

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('عنوان درخواست الزامی است')
      return
    }

    setIsSubmitting(true)
    try {
      // const { serviceApi } = await import('@features/services/services/serviceApi')
      await serviceApi.buyerUpdateRequest(request.id, {
        title,
        description,
        equipment_details: equipmentDetails,
      })
      toast.success('درخواست با موفقیت ویرایش شد')
      onUpdate?.()
      onClose()
    } catch (error) {
      toast.error(error.userMessage || 'خطا در ویرایش درخواست')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!request) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ویرایش درخواست خدمت"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            <FiX className="ml-1" /> انصراف
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} loadingText="در حال ذخیره...">
            <FiCheck className="ml-1" /> ذخیره تغییرات
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* عنوان */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            عنوان درخواست *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 p-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="عنوان درخواست"
          />
        </div>

        {/* شرح مشکل */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            شرح مشکل
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 p-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="توضیحات..."
          />
        </div>

        {/* مشخصات تجهیز */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            مشخصات تجهیز
          </label>
          <textarea
            value={equipmentDetails}
            onChange={(e) => setEquipmentDetails(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 p-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="برند، مدل، سال ساخت..."
          />
        </div>
      </div>
    </Modal>
  )
}