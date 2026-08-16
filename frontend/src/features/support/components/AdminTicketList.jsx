// src/features/support/components/AdminTicketList.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronLeft, FiMessageSquare, FiFilter, FiSearch } from 'react-icons/fi'
import { Badge, Button, Input, Select, Spinner } from '@components/ui'
import { cn, formatDate } from '@lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'open', label: 'باز' },
  { value: 'in_review', label: 'در بررسی' },
  { value: 'resolved', label: 'حل شده' },
  { value: 'closed', label: 'بسته شده' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'همه اولویت‌ها' },
  { value: 'low', label: 'پایین' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'بالا' },
  { value: 'urgent', label: 'فوری' },
]

const STATUS_COLORS = {
  open: 'warning',
  in_review: 'info',
  resolved: 'success',
  closed: 'secondary',
}

export const AdminTicketList = ({
  tickets = [],
  isLoading = false,
  onFilter,
  className = '',
}) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  })

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter?.(newFilters)
  }

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
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* فیلترها */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="جستجو در موضوع، شماره یا نام کاربر..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pr-10"
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          options={STATUS_OPTIONS}
          className="w-full sm:w-40"
        />
        <Select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          options={PRIORITY_OPTIONS}
          className="w-full sm:w-40"
        />
      </div>

      {/* لیست تیکت‌ها */}
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/dashboard/admin/tickets/${ticket.id}`}
            className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {ticket.subject}
                  </h3>
                  <Badge variant={STATUS_COLORS[ticket.status] || 'secondary'} size="sm">
                    {ticket.status === 'open' ? 'باز' :
                     ticket.status === 'in_review' ? 'در بررسی' :
                     ticket.status === 'resolved' ? 'حل شده' : 'بسته شده'}
                  </Badge>
                  <Badge variant={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'danger' : 'secondary'} size="sm">
                    {ticket.priority === 'low' ? '🟢 پایین' :
                     ticket.priority === 'medium' ? '🟡 متوسط' :
                     ticket.priority === 'high' ? '🟠 بالا' : '🔴 فوری'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDate(ticket.created_at)}</span>
                  <span>کاربر: {ticket.user_name || ticket.user_phone}</span>
                  {ticket.messages_count > 0 && (
                    <span className="flex items-center gap-1">
                      <FiMessageSquare className="h-3 w-3" />
                      {ticket.messages_count} پیام
                    </span>
                  )}
                  {ticket.assigned_to_name && (
                    <span>اختصاص به: {ticket.assigned_to_name}</span>
                  )}
                </div>
              </div>
              <FiChevronLeft className="text-gray-400 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}