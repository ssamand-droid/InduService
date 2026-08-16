import { useState, useRef } from 'react'
import { FiUpload, FiX, FiCheck } from 'react-icons/fi'
import { Button, Modal } from '@components/ui'
import api from '@lib/axios'
import toast from 'react-hot-toast'

export const PortfolioUploader = ({ onSuccess }) => {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handleSubmit = async () => {
    if (!file || !title) { toast.error('عنوان و تصویر الزامی است'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('image', file)
      await api.post('/api/portfolio/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('نمونه کار اضافه شد')
      setShowForm(false)
      onSuccess?.()
    } catch (error) {
      toast.error('خطا در آپلود')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setShowForm(true)}>
        <FiUpload className="ml-1" /> افزودن نمونه کار
      </Button>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="نمونه کار جدید" size="sm">
        <div className="space-y-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border rounded p-2" placeholder="عنوان نمونه کار *" />
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={2} className="w-full border rounded p-2" placeholder="توضیحات (اختیاری)" />
          <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <input type="file" ref={fileRef} className="hidden" accept="image/*"
              onChange={e => setFile(e.target.files[0])} />
            {file ? <FiCheck className="text-green-500 mx-auto h-8 w-8" /> : <FiUpload className="mx-auto h-8 w-8 text-secondary-400" />}
            <p className="text-sm mt-1">{file ? file.name : 'انتخاب تصویر'}</p>
          </div>
          <Button variant="primary" fullWidth onClick={handleSubmit} isLoading={uploading}>ذخیره</Button>
        </div>
      </Modal>
    </>
  )
}