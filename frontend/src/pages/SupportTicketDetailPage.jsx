// src/pages/SupportTicketDetailPage.jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiClock, FiMessageSquare, FiUser, FiXCircle, FiInfo } from 'react-icons/fi'
import { Card, Badge, Button, Spinner, ConfirmModal } from '@components/ui'
import {
  useTicket,
  useTicketMessages,
  useCloseTicket,
  useSendTicketMessage,
  TicketMessageInput,
} from '@features/support'
import { useAuthStore } from '@stores/authStore'

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

export default function SupportTicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'admin' || user?.is_staff

  const [showCloseModal, setShowCloseModal] = useState(false)

  const { data: ticketData, isLoading: ticketLoading } = useTicket(id)
  const { data: messagesData, isLoading: messagesLoading } = useTicketMessages(id)
  const closeTicket = useCloseTicket()
  const sendMessage = useSendTicketMessage()

  // ✅ داده‌ها را به درستی استخراج کنید
  const ticket = ticketData?.data || ticketData
  const messages = messagesData?.results || messagesData || []

  const isClosed = ticket?.status === 'closed' || ticket?.status === 'resolved'
  const canSendMessage = !isClosed || isAdmin

  const handleCloseTicket = () => {
    closeTicket.mutate(id, {
      onSuccess: () => {
        setShowCloseModal(false)
      },
    })
  }

  const handleSendMessage = (formData) => {
    sendMessage.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          setTimeout(() => {
            const messagesContainer = document.getElementById('messages-container')
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight
            }
          }, 100)
        },
      }
    )
  }

  const handleGoBack = () => {
    if (isAdmin) {
      navigate('/dashboard/admin/support')
    } else {
      navigate('/dashboard/support')
    }
  }

  // دیباگ
  console.log('Ticket Data:', ticket)
  console.log('Messages Data:', messages)

  if (ticketLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">تیکت یافت نشد</p>
          <Button variant="primary" className="mt-4" onClick={handleGoBack}>
            بازگشت
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* هدر تیکت */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white break-words">
              {ticket.subject || 'بدون موضوع'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant={STATUS_COLORS[ticket.status] || 'secondary'}>
                {STATUS_LABELS[ticket.status] || ticket.status || 'نامشخص'}
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
              onClick={() => setShowCloseModal(true)}
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
          پیام‌ها ({messages?.length || 0})
        </h3>

        <div id="messages-container" className="space-y-4 max-h-[500px] overflow-y-auto">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              هنوز پیامی ارسال نشده است
            </p>
          ) : (
            messages.map((msg, index) => {
              const isAdminMsg = msg.sender?.is_staff || msg.sender?.role === 'admin'
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 p-3 rounded-lg ${
                    isAdminMsg
                      ? 'bg-blue-50 dark:bg-blue-900/20 mr-4'
                      : 'bg-gray-50 dark:bg-gray-700/30 ml-4'
                  }`}
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
                        {isAdminMsg && (
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
              )
            })
          )}
        </div>
      </div>

      {/* ورودی پیام */}
      {!isClosed || isAdmin ? (
        <Card>
          <div className="p-4 md:p-6">
            <TicketMessageInput
              onSend={handleSendMessage}
              isLoading={sendMessage.isPending}
              disabled={!canSendMessage}
              placeholder={
                isClosed
                  ? 'این تیکت بسته شده است. فقط ادمین می‌تواند پیام ارسال کند.'
                  : 'پیام خود را بنویسید...'
              }
            />
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-4 md:p-6 text-center">
            <div className="h-8 w-8 text-green-500 mx-auto mb-2">✅</div>
            <p className="text-gray-600 dark:text-gray-400">
              این تیکت بسته شده است. برای ارسال پیام جدید، لطفاً تیکت جدیدی ایجاد کنید.
            </p>
          </div>
        </Card>
      )}

      {/* مودال تأیید بستن تیکت */}
      <ConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleCloseTicket}
        title="بستن تیکت"
        message="آیا از بستن این تیکت اطمینان دارید؟ پس از بستن، فقط ادمین می‌تواند پیام ارسال کند."
        confirmText="بستن تیکت"
        cancelText="انصراف"
        variant="danger"
        isLoading={closeTicket.isPending}
      />
    </div>
  )
}