// src/features/services/components/ServiceCompletionForm.jsx
import { useState, useRef } from 'react'
import { FiCheck, FiX, FiUpload, FiCamera } from 'react-icons/fi'
import { Button, Modal } from '@components/ui'
import { serviceApi } from '../services/serviceApi'
import toast from 'react-hot-toast'

export const ServiceCompletionForm = ({ isOpen, onClose, request, onSuccess }) => {
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileRef = useRef(null)

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setImages(prev => [...prev, ...newFiles].slice(0, 10))
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('گزارش انجام کار را وارد کنید')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('completion_notes', notes)
      images.forEach((img) => formData.append('images', img))

      await serviceApi.completeWithImages(request.id, formData)
      toast.success('خدمت با موفقیت تکمیل شد')
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error.userMessage || 'خطا در تکمیل خدمت')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تکمیل خدمت" size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}><FiX className="ml-1" /> انصراف</Button>
          <Button variant="success" onClick={handleSubmit} isLoading={isSubmitting} loadingText="در حال ثبت...">
            <FiCheck className="ml-1" /> تکمیل خدمت
          </Button>
        </>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">یادداشت تکمیل کار</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            className="w-full rounded-lg border p-2.5 dark:bg-secondary-800" placeholder="توضیحات نهایی..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <FiCamera /> تصاویر انجام کار (حداکثر ۱۰ عدد)
          </label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary-500"
            onClick={() => fileRef.current?.click()}>
            <input type="file" ref={fileRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
            <FiUpload className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
            <p className="text-sm text-secondary-500">کلیک کنید یا تصاویر را اینجا رها کنید</p>
          </div>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(img)} alt="" className="h-24 w-full object-cover rounded" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
