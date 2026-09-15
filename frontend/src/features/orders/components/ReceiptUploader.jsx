import { useState, useRef } from 'react'
import { FiUpload, FiCheck, FiCamera } from 'react-icons/fi'
import { Button } from '@components/ui'
import api from '@lib/axios'
import toast from 'react-hot-toast'

export const ReceiptUploader = ({ orderId, onSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files[0]
    if (!file) {
      toast.error('لطفاً فایل رسید را انتخاب کنید')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('receipt', file)

      await api.post(`/api/orders/orders/${orderId}/upload_receipt/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('رسید پرداخت با موفقیت ثبت شد')
      onSuccess?.()
    } catch (error) {
      toast.error(error.userMessage || 'خطا در آپلود رسید')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="text-center space-y-4">
      <div className="p-6 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-xl hover:border-primary-500 transition cursor-pointer"
        onClick={() => fileRef.current?.click()}>
        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

        {preview ? (
          <img src={preview} alt="پیش‌نمایش" className="max-h-40 mx-auto rounded-lg mb-3" />
        ) : (
          <div className="text-center">
            <FiUpload className="h-10 w-10 mx-auto text-secondary-400 mb-3" />
            <p className="text-secondary-600">کلیک کنید یا تصویر رسید را اینجا رها کنید</p>
            <p className="text-xs text-secondary-400 mt-1">فرمت‌های مجاز: JPG, PNG, PDF</p>
          </div>
        )}
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleUpload}
        isLoading={uploading}
        loadingText="در حال آپلود..."
        disabled={!preview}
      >
        <FiCheck className="ml-2" />
        ثبت رسید پرداخت
      </Button>
    </div>
  )
}