// src/pages/AdminProductsPage.jsx - نسخه اصلاح شده

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiSearch, FiEye, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Input } from '@components/ui'
import api from '@lib/axios'
import { formatPrice } from '@lib/utils'

// تابع امن فرمت قیمت با هزارگان
const safeFormatPrice = (price) => {
  if (!price && price !== 0) return '—'
  const num = Number(price)
  if (isNaN(num)) return '—'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + ' ریال'
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/api/products/products/').then(res => res.data),
    retry: 1,
    staleTime: 30000,
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

  const results = products?.results || products || []
  const filtered = results.filter(p =>
    p.name?.includes(search) ||
    p.sku?.includes(search)
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">مدیریت محصولات</h1>
        <Link to="/dashboard/products/new">
          <Button variant="primary" size="sm">
            <FiPlus className="ml-1" /> محصول جدید
          </Button>
        </Link>
      </div>

      {/* جستجو */}
      <div className="relative max-w-md">
        <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="جستجو بر اساس نام یا کد انبار..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* جدول */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-right text-sm font-medium text-gray-500">
                <th className="p-3">نام محصول</th>
                <th className="p-3">کد انبار</th>
                <th className="p-3">قیمت</th>
                <th className="p-3">موجودی</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    محصولی یافت نشد
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-900">{product.name}</td>
                    <td className="p-3 text-gray-600">{product.sku}</td>
                    <td className="p-3 font-medium text-blue-600">{safeFormatPrice(product.price)}</td>
                    <td className="p-3">{product.stock_quantity || 0}</td>
                    <td className="p-3">
                      <Badge variant={product.is_active ? 'success' : 'secondary'} size="sm">
                        {product.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link to={`/products/${product.slug}`}>
                          <Button variant="ghost" size="xs" title="مشاهده">
                            <FiEye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link to={`/dashboard/products/${product.slug}/edit`}>
                          <Button variant="ghost" size="xs" title="ویرایش">
                            <FiEdit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-sm text-gray-500">
        تعداد کل: {filtered.length} محصول
      </div>
    </div>
  )
}