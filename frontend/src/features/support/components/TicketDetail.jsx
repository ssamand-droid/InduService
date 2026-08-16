// src/features/support/components/TicketDetail.jsx
import { useEffect, useRef } from 'react'
import { FiMessageSquare, FiUser, FiClock, FiXCircle, FiInfo } from 'react-icons/fi'
import { Badge, Button, Spinner } from '@components/ui'
import { cn } from '@lib/utils'

const formatDateSafe = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  } catch (e) {
    return '-'
  }
}

const STATUS_COLORS = {
  open: 'warning',
  in_review: 'info',
  resolved: 'success',
  closed: 'secondary',
}

const STATUS_LABELS = {
  open: 'باز',
  in_review: 'در بررسی',
  resolved: 'حل شده',
  closed: 'بسته شده',
}

export const TicketDetail = ({
  ticket,
  messages = [],
  isLoading = false,
  isAdmin = false,
  onCloseTicket,
  className = '',
}) => {
  const messagesEndRef = useRef(null)
  const isClosed = ticket?.status === 'closed' || ticket?.status === 'resolved'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>تیکت یافت نشد</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* هدر تیکت */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white break-words">
              {ticket.subject}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant={STATUS_COLORS[ticket.status] || 'secondary'}>
                {STATUS_LABELS[ticket.status] || ticket.status}
              </Badge>
              <Badge variant="secondary">
                {ticket.category_display || ticket.category || 'سایر'}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <FiClock className="h-4 w-4" />
                {formatDateSafe(ticket.created_at)}
              </span>
            </div>
          </div>

          {!isClosed && (
            <Button
              variant="danger"
              size="sm"
              onClick={onCloseTicket}
              className="flex-shrink-0 w-full sm:w-auto"
            >
              <FiXCircle className="ml-1" />
              بستن تیکت
            </Button>
          )}
        </div>

        {/* ✅ نمایش توضیحات تیکت (body) */}
        {ticket.body && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <FiInfo className="h-4 w-4" />
              <span>توضیحات</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {ticket.body}
            </p>
          </div>
        )}

        {/* اطلاعات کاربر (فقط برای ادمین) */}
        {isAdmin && ticket.user_name && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-3">
            <FiUser className="text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <strong>کاربر:</strong> {ticket.user_name} ({ticket.user_phone})
            </span>
          </div>
        )}
      </div>

      {/* پیام‌ها */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <FiMessageSquare className="h-5 w-5" />
          پیام‌ها ({messages.length})
        </h3>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              هنوز پیامی ارسال نشده است
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={cn(
                  'flex gap-3 p-3 rounded-lg',
                  msg.sender?.is_staff || msg.sender?.role === 'admin'
                    ? 'bg-blue-50 dark:bg-blue-900/20 mr-4'
                    : 'bg-gray-50 dark:bg-gray-700/30 ml-4'
                )}
              >
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {msg.sender?.full_name?.[0] || msg.sender?.phone_number?.[0] || 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {msg.sender?.full_name || msg.sender?.phone_number || 'کاربر'}
                      </span>
                      {msg.sender?.is_staff && (
                        <Badge variant="primary" size="sm">
                          ادمین
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateSafe(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-1.5 whitespace-pre-wrap text-sm">
                    {msg.body}
                  </p>
                  {msg.attachment && (
                    <a
                      href={msg.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1.5 inline-flex items-center gap-1"
                    >
                      📎 مشاهده پیوست
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}