// src/pages/AdminServicesPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiSearch } from 'react-icons/fi'
import api from '@lib/axios'

const safeFormatPrice = (price) => {
  if (!price && price !== 0) return 'استعلام'
  const num = Number(price)
  if (isNaN(num)) return 'استعلام'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + ' ریال'
}

const safeFormatDate = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`
  } catch { return '—' }
}

export default function AdminServicesPage() {
  const [search, setSearch] = useState('')

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => api.get('/api/services/services/').then(res => res.data),
  })

  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
  if (error) return <div className="p-6 text-red-600">خطا در دریافت خدمات</div>

  const results = services?.results || services || []
  const filtered = results.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.provider_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">مدیریت خدمات</h1>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="جستجو بر اساس عنوان یا ارائه‌دهنده..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="table-responsive">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="text-right text-sm font-medium text-gray-500">
              <th className="p-3">عنوان</th>
              <th className="p-3">ارائه‌دهنده</th>
              <th className="p-3 hidden md:table-cell">نوع</th>
              <th className="p-3">قیمت</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3 hidden sm:table-cell">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">خدمتی یافت نشد</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium">{s.title}</td>
                  <td className="p-3">{s.provider_name || '—'}</td>
                  <td className="p-3 hidden md:table-cell">{s.service_type || '—'}</td>
                  <td className="p-3 font-medium text-blue-600">{safeFormatPrice(s.base_price)}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-sm text-gray-500">{safeFormatDate(s.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}