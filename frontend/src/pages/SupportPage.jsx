// src/pages/SupportPage.jsx - اصلاح شده
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import { Card, Button, Modal, Spinner } from '@components/ui'
import {
  TicketList,
  TicketForm,
  useMyTickets,
  useCreateTicket,
} from '@features/support'

export default function SupportPage() {
  const navigate = useNavigate()
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [filters, setFilters] = useState({})

  const { data, isLoading, refetch } = useMyTickets(filters)
  const createTicket = useCreateTicket()

  const tickets = data?.results || []

  useEffect(() => {
    if (createTicket.isSuccess) {
      setShowNewTicket(false)
      refetch()
      const ticketId = createTicket.data?.data?.id
      if (ticketId) {
        // ✅ مسیر صحیح برای هدایت بعد از ایجاد تیکت
        navigate(`/dashboard/support/tickets/${ticketId}`)
      }
    }
  }, [createTicket.isSuccess, createTicket.data, navigate, refetch])

  const handleCreateTicket = (formData) => {
    createTicket.mutate(formData)
  }

  const handleTicketClick = (ticketId) => {
    // ✅ این تابع دیگر نیازی نیست چون از Link استفاده می‌کنیم
    // ولی اگر می‌خواهید نگه دارید، مسیر را اصلاح کنید
    navigate(`/dashboard/support/tickets/${ticketId}`)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">پشتیبانی</h1>
        <Button variant="primary" size="sm" onClick={() => setShowNewTicket(true)}>
          <FiPlus className="ml-1" />
          تیکت جدید
        </Button>
      </div>

      <Card>
        <div className="p-4 md:p-6">
          <TicketList
            tickets={tickets}
            isLoading={false}
            isAdmin={false}
            onTicketClick={handleTicketClick}
          />
        </div>
      </Card>

      <Modal
        isOpen={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        title="تیکت جدید"
        size="lg"
      >
        <TicketForm
          onSubmit={handleCreateTicket}
          onCancel={() => setShowNewTicket(false)}
          isLoading={createTicket.isPending}
        />
      </Modal>
    </div>
  )
}