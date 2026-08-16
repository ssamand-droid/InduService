// src/pages/NotificationsPage.jsx - نسخه اصلاح شده
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'  // ← اضافه شد
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiCheck, FiBell, FiArrowRight } from 'react-icons/fi'  // ← FiArrowRight اضافه شد
import api from '@lib/axios'
import { formatDateSafe } from '@lib/utils'
import toast from 'react-hot-toast'
import { Button } from '@components/ui'  // ← اضافه شد

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()  // ← اضافه شد
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.get('/api/notifications/notifications/?page=' + page).then(res => res.data),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (ids) => api.post('/api/notifications/notifications/mark_as_read/', { notification_ids: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.post('/api/notifications/notifications/mark_all_read/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
      toast.success('همه اعلان‌ها خوانده شد')
    },
  })

  const notifications = data?.results || []
  const hasUnread = notifications.some(n => !n.is_read)

  const getIcon = (type) => {
    const icons = {
      order: '🛒',
      service: '🔧',
      payment: '💰',
      system: '📢',
      review: '⭐',
      service_request: '📋'
    }
    return icons[type] || '🔔'
  }

  // ← تابع بازگشت اضافه شد
  const handleGoBack = () => {
    navigate('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="container-custom py-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">در حال بارگذاری...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-custom py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          خطا در دریافت اعلان‌ها
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8 max-w-3xl mx-auto">
      {/* ← هدر با دکمه بازگشت */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="p-2"
          >
            <FiArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">اعلان‌ها</h1>
        </div>
        {hasUnread && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FiCheck size={16} /> خواندن همه
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
          <FiBell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">هیچ اعلانی وجود ندارد</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.link || '#'}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsReadMutation.mutate([notification.id])
                  }
                }}
                className={`block p-4 hover:bg-gray-50 transition ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-medium ${!notification.is_read ? 'text-blue-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          جدید
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{notification.message}</p>
                    <p className="text-xs text-gray-400">{formatDateSafe(notification.created_at)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!data.previous}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200"
              >
                قبلی
              </button>
              <span className="text-sm text-gray-500">صفحه {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data.next}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200"
              >
                بعدی
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}