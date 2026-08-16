// src/features/support/components/TicketList.jsx - اصلاح لینک
import { Link } from 'react-router-dom'
import { FiChevronLeft, FiMessageSquare } from 'react-icons/fi'
import { Badge, Spinner } from '@components/ui'
import { cn } from '@lib/utils'

// ============================================================
// تابع تاریخ ساده
// ============================================================
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

const PRIORITY_COLORS = {
  low: 'secondary',
  medium: 'warning',
  high: 'danger',
  urgent: 'danger',
}

export const TicketList = ({
  tickets = [],
  isLoading = false,
  isAdmin = false,
  onTicketClick,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <FiMessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-lg">تیکتی یافت نشد</p>
        <p className="text-sm mt-1">برای ایجاد تیکت جدید، دکمه افزودن را بزنید</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {tickets.map((ticket) => {
        // ✅ مسیر صحیح برای هر نوع کاربر
        const ticketPath = isAdmin
          ? `/dashboard/admin/support/tickets/${ticket.id}`
          : `/dashboard/support/tickets/${ticket.id}`  // ← این مسیر صحیح است

        return (
          <Link
            key={ticket.id}
            to={ticketPath}
            className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {ticket.subject}
                  </h3>
                  <Badge variant={STATUS_COLORS[ticket.status] || 'secondary'} size="sm">
                    {STATUS_LABELS[ticket.status] || ticket.status}
                  </Badge>
                  <Badge variant={PRIORITY_COLORS[ticket.priority] || 'secondary'} size="sm">
                    {ticket.priority === 'urgent' ? '🔴' :
                     ticket.priority === 'high' ? '🟠' :
                     ticket.priority === 'medium' ? '🟡' : '🟢'}
                    {' '}{ticket.priority === 'low' ? 'پایین' :
                      ticket.priority === 'medium' ? 'متوسط' :
                      ticket.priority === 'high' ? 'بالا' : 'فوری'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDateSafe(ticket.created_at)}</span>
                  {ticket.messages_count > 0 && (
                    <span className="flex items-center gap-1">
                      <FiMessageSquare className="h-3 w-3" />
                      {ticket.messages_count}
                    </span>
                  )}
                  {isAdmin && ticket.user_name && (
                    <span>کاربر: {ticket.user_name}</span>
                  )}
                </div>
              </div>
              <FiChevronLeft className="text-gray-400 flex-shrink-0" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}