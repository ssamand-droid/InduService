// frontend/src/features/notifications/components/NotificationBell.jsx

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiCheck } from 'react-icons/fi'
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications'
import { useAuthStore } from '@stores/authStore'

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  
  const { data: unreadData } = useUnreadCount()
  const { data: notificationsData, isLoading } = useNotifications(1)
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllAsRead } = useMarkAllAsRead()

  const unreadCount = unreadData?.unread_count || 0
  const notifications = notificationsData?.results || []

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated || !accessToken) {
    return null
  }

  const handleMarkAsRead = (notificationIds) => {
    markAsRead(notificationIds)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead([notification.id])
    }
    setIsOpen(false)
    if (notification.link && notification.link !== '#') {
      window.location.href = notification.link
    }
  }

  const formatSimpleDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
    } catch (e) {
      return ''
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      order: '🛒',
      service: '🔧',
      service_request: '🔧',
      payment: '💰',
      system: '📢',
      review: '⭐',
    }
    return icons[type] || '📌'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        aria-label="اعلان‌ها"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <div className={`
            fixed sm:absolute 
            left-0 sm:left-auto sm:right-0 
            bottom-0 sm:bottom-auto sm:top-full 
            w-full sm:w-96 
            max-h-[70vh] sm:max-h-96 
            rounded-t-2xl sm:rounded-lg 
            bg-white dark:bg-gray-800 
            shadow-lg border-t sm:border 
            border-gray-200 dark:border-gray-700 
            z-50
            flex flex-col
            animate-slide-up sm:animate-none
          `}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl sm:rounded-t-lg">
              <h3 className="font-medium text-gray-900 dark:text-white">اعلان‌ها</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FiCheck className="h-3 w-3" />
                  خواندن همه
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="sm:hidden text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <FiBell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">اعلانی وجود ندارد</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => {
                    if (!notification) return null
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <span className="text-xl shrink-0">{getTypeIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm break-words ${!notification.is_read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notification.title || 'اعلان'}
                            </p>
                            {!notification.is_read && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 shrink-0 mt-1">
                                جدید
                              </span>
                            )}
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words">{notification.message || ''}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatSimpleDate(notification.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-blue-600 hover:underline py-1"
              >
                مشاهده همه اعلان‌ها
              </Link>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @media (min-width: 640px) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}