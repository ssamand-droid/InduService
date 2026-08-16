import { useState, useRef } from 'react'
import { FiUpload, FiCheck } from 'react-icons/fi'
import { Button } from '@components/ui'
import { serviceApi } from '../services/serviceApi'
import toast from 'react-hot-toast'

export const UploadReceiptButton = ({ requestId, paymentType = 'final', onSuccess }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handleUpload = async () => {
    if (!file) { toast.error('رسید را انتخاب کنید'); return }
    setUploading(true)
    try {
      await serviceApi.uploadPaymentReceipt(requestId, file, paymentType)
      toast.success('رسید آپلود شد. در انتظار تایید ادمین.')
      onSuccess?.()
    } catch (error) {
      toast.error(error.userMessage || 'خطا در آپلود')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files[0])} />
      
      {file ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <FiCheck className="text-green-500" />
          <span className="text-sm">{file.name}</span>
          <button className="text-xs text-primary-600 hover:underline mr-auto" onClick={() => setFile(null)}>
            تغییر
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary-500"
          onClick={() => fileRef.current?.click()}>
          <FiUpload className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
          <p className="text-sm text-secondary-500">کلیک کنید یا رسید را اینجا رها کنید</p>
        </div>
      )}

      <Button variant="primary" fullWidth onClick={handleUpload} disabled={!file} isLoading={uploading}>
        <FiUpload className="ml-2" /> آپلود رسید پرداخت
      </Button>
    </div>
  )
}