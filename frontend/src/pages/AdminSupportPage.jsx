// src/pages/AdminSupportPage.jsx - نسخه اصلاح شده با تابع تاریخ داخلی

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiMessageSquare, FiEye, FiCheck, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Input, Alert } from '@components/ui'
import api from '@lib/axios'
import toast from 'react-hot-toast'

// ============================================================
// تابع تاریخ ساده - جایگزین formatDate
// ============================================================
const formatDateSafe = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
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

const PRIORITY_LABELS = {
  low: '🟢 پایین',
  medium: '🟡 متوسط',
  high: '🟠 بالا',
  urgent: '🔴 فوری',
}

export default function AdminSupportPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-tickets', statusFilter, priorityFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      params.append('page', page)
      params.append('page_size', 20)
      return api.get(`/api/support/admin/tickets/?${params}`).then(res => res.data)
    },
    retry: false,
    staleTime: 30000,
  })

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/api/support/tickets/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
      toast.success('بروزرسانی شد')
    },
  })

  const tickets = data?.results || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  // فیلتر بر اساس جستجو
  const filteredTickets = tickets.filter(ticket => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      ticket.subject?.toLowerCase().includes(searchLower) ||
      ticket.user_name?.toLowerCase().includes(searchLower) ||
      ticket.user_phone?.includes(search)
    )
  })

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handleTicketClick = (ticketId) => {
    navigate(`/dashboard/admin/support/tickets/${ticketId}`)
  }

  const handleStatusChange = (ticketId, newStatus) => {
    updateTicketMutation.mutate({ id: ticketId, data: { status: newStatus } })
  }

  const handleCloseTicket = (ticketId) => {
    if (window.confirm('آیا از بستن این تیکت اطمینان دارید؟')) {
      updateTicketMutation.mutate({ id: ticketId, data: { status: 'closed' } })
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error">خطا در دریافت اطلاعات تیکت‌ها</Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مدیریت پشتیبانی</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="primary">{totalCount} تیکت</Badge>
          <Badge variant="warning">
            {tickets.filter(t => t.status === 'open').length} باز
          </Badge>
          <Badge variant="info">
            {tickets.filter(t => t.status === 'in_review').length} در بررسی
          </Badge>
        </div>
      </div>

      {/* فیلترها */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="جستجوی موضوع یا کاربر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg p-2 dark:bg-gray-800 text-sm w-full sm:w-auto"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="open">باز</option>
            <option value="in_review">در بررسی</option>
            <option value="resolved">حل شده</option>
            <option value="closed">بسته شده</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border rounded-lg p-2 dark:bg-gray-800 text-sm w-full sm:w-auto"
          >
            <option value="">همه اولویت‌ها</option>
            <option value="low">پایین</option>
            <option value="medium">متوسط</option>
            <option value="high">بالا</option>
            <option value="urgent">فوری</option>
          </select>
        </div>
      </Card>

      {/* لیست تیکت‌ها */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                <th className="p-3">موضوع</th>
                <th className="p-3 hidden sm:table-cell">کاربر</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3 hidden md:table-cell">اولویت</th>
                <th className="p-3 hidden lg:table-cell">پیام‌ها</th>
                <th className="p-3 hidden xl:table-cell">تاریخ</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <FiMessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    تیکتی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="p-3">
                      <button
                        onClick={() => handleTicketClick(ticket.id)}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-right"
                      >
                        {ticket.subject}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                        {ticket.user_name || ticket.user_phone}
                      </p>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                      {ticket.user_name || ticket.user_phone || '-'}
                    </td>
                    <td className="p-3">
                      <Badge variant={STATUS_COLORS[ticket.status] || 'secondary'} size="sm">
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant={PRIORITY_COLORS[ticket.priority] || 'secondary'} size="sm">
                        {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                      </Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-center text-gray-500 dark:text-gray-400">
                      {ticket.messages_count || 0}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-gray-500 dark:text-gray-400 text-xs">
                      {formatDateSafe(ticket.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => handleTicketClick(ticket.id)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="مشاهده"
                        >
                          <FiEye className="h-4 w-4 text-blue-500" />
                        </button>
                        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(ticket.id, 'in_review')}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="در بررسی"
                            >
                              <FiCheck className="h-4 w-4 text-yellow-500" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(ticket.id, 'resolved')}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="حل شده"
                            >
                              <FiCheck className="h-4 w-4 text-green-500" />
                            </button>
                            <button
                              onClick={() => handleCloseTicket(ticket.id)}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="بستن"
                            >
                              <FiX className="h-4 w-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            نمایش {filteredTickets.length} از {totalCount} نتیجه
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              صفحه {page} از {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}