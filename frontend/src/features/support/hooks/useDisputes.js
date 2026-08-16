// src/features/support/hooks/useDisputes.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { disputeApi } from '../services/disputeApi'
import toast from 'react-hot-toast'

export const useCreateDispute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disputeApi.createDispute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('اختلاف با موفقیت ثبت شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در ثبت اختلاف')
    },
  })
}

export const useResolveDispute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => disputeApi.resolveDispute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('اختلاف با موفقیت حل شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در حل اختلاف')
    },
  })
}