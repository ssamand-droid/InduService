import { useState } from 'react'
import { Button, Card } from '@components/ui'
import api from '@lib/axios'
import toast from 'react-hot-toast'

export default function AdminBlogPageSimple() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !content) {
      toast.error('عنوان و محتوا الزامی است')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      formData.append('status', 'published')
      formData.append('excerpt', content.substring(0, 150))

      const response = await api.post('/api/blog/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      toast.success('مقاله با موفقیت ایجاد شد')
      setTitle('')
      setContent('')
    } catch (error) {
      console.error('خطا:', error.response?.data)
      toast.error(error.response?.data?.message || 'خطا در ایجاد مقاله')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-bold mb-6">مدیریت وبلاگ - نسخه ساده</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border p-2"
              placeholder="عنوان مقاله"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">محتوا *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full rounded-lg border p-2"
              placeholder="متن مقاله..."
            />
          </div>

          <Button type="submit" variant="primary" isLoading={loading}>
            ایجاد مقاله
          </Button>
        </form>
      </Card>
    </div>
  )
}