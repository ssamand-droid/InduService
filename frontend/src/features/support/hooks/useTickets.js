// src/features/support/hooks/useTickets.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketApi } from '../services/ticketApi'
import toast from 'react-hot-toast'

const TICKETS_QUERY_KEY = ['tickets']

// ─── هوک‌های کاربر ──────────────────────────────────────────

export const useMyTickets = (params = {}) => {
  return useQuery({
    queryKey: [TICKETS_QUERY_KEY, 'my', params],
    queryFn: () => ticketApi.getMyTickets(params).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  })
}

export const useTicket = (id) => {
  return useQuery({
    queryKey: [TICKETS_QUERY_KEY, 'detail', id],
    queryFn: () => ticketApi.getTicket(id).then(res => res.data),
    enabled: !!id,
  })
}

export const useTicketMessages = (ticketId) => {
  return useQuery({
    queryKey: [TICKETS_QUERY_KEY, 'messages', ticketId],
    queryFn: () => ticketApi.getTicketMessages(ticketId).then(res => res.data),
    enabled: !!ticketId,
    refetchInterval: 10000, // بروزرسانی هر ۱۰ ثانیه
  })
}

export const useCreateTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ticketApi.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY })
      toast.success('تیکت با موفقیت ایجاد شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در ایجاد تیکت')
    },
  })
}

export const useCloseTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ticketApi.closeTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY })
      toast.success('تیکت بسته شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در بستن تیکت')
    },
  })
}

export const useSendTicketMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => ticketApi.sendMessage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [TICKETS_QUERY_KEY, 'messages', variables.id],
      })
      queryClient.invalidateQueries({
        queryKey: [TICKETS_QUERY_KEY, 'detail', variables.id],
      })
      toast.success('پیام با موفقیت ارسال شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در ارسال پیام')
    },
  })
}

// ─── هوک‌های ادمین ──────────────────────────────────────────

export const useAllTickets = (params = {}) => {
  return useQuery({
    queryKey: [TICKETS_QUERY_KEY, 'admin', params],
    queryFn: () => ticketApi.getAllTickets(params).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  })
}

export const useAdminUpdateTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => ticketApi.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY })
      toast.success('تیکت با موفقیت به‌روزرسانی شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در به‌روزرسانی تیکت')
    },
  })
}