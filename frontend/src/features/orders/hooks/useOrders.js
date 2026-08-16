import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '../services/orderApi'
import toast from 'react-hot-toast'

export const useOrders = (filters = {}) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderApi.getOrders(filters),
    keepPreviousData: true,
  })
}

export const useOrder = (id) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrder(id),
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApi.createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('سفارش با موفقیت ثبت شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا در ثبت سفارش'),
  })
}

export const useConfirmOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApi.confirmOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('سفارش تایید شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا در تایید سفارش'),
  })
}

export const useShipOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApi.shipOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('ارسال سفارش ثبت شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا در ثبت ارسال'),
  })
}

export const useDeliverOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApi.deliverOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('تحویل سفارش تایید شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا در تایید تحویل'),
  })
}

export const useCompleteOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApi.completeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('سفارش تکمیل شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا در تکمیل سفارش'),
  })
}