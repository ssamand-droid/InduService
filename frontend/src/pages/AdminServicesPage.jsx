// AdminServicesPage.jsx - نسخه اصلاح شده با قیمت و تاریخ امن

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiSearch } from 'react-icons/fi'
import api from '@lib/axios'

// تابع امن فرمت قیمت
const safeFormatPrice = (price) => {
  if (!price && price !== 0) return 'استعلام'
  const num = Number(price)
  if (isNaN(num)) return 'استعلام'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + ' ریال'
}

// تابع امن فرمت تاریخ
const safeFormatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  } catch (e) {
    return ''
  }
}

export default function AdminServicesPage() {
  const [search, setSearch] = useState('')

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => api.get('/api/services/services/').then(res => res.data),
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
          خطا در دریافت اطلاعات: {error.message}
        </div>
      </div>
    )
  }

  if (!services) {
    return (
      <div className="p-6 text-center text-gray-500">
        داده‌ای وجود ندارد
      </div>
    )
  }

  const results = services.results || services || []
  const filtered = results.filter(s => 
    s.title?.includes(search) || 
    s.provider_name?.includes(search)
  )

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">مدیریت خدمات</h1>
      
      {/* جستجو */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="جستجو بر اساس عنوان یا ارائه‌دهنده..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* جدول */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-right text-sm font-medium text-gray-500">
                <th className="p-3">عنوان</th>
                <th className="p-3">ارائه‌دهنده</th>
                <th className="p-3">نوع</th>
                <th className="p-3">قیمت</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    خدمتی یافت نشد
                   </td>
                 </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-900">{s.title}</td>
                    <td className="p-3 text-gray-600">{s.provider_name || '---'}</td>
                    <td className="p-3 text-gray-600">{s.service_type || '---'}</td>
                    <td className="p-3 font-medium text-blue-600">{safeFormatPrice(s.base_price)}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-sm">{safeFormatDate(s.created_at)}</td>
                   </tr>
                ))
              )}
            </tbody>
           </table>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        تعداد کل: {filtered.length} خدمت
      </div>
    </div>
  )
}