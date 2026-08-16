// src/features/settings/hooks/useSettings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingApi } from '../services/settingApi'
import toast from 'react-hot-toast'

const SETTINGS_QUERY_KEY = ['platform-settings']

export const useSettings = (params = {}) => {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, params],
    queryFn: () => settingApi.getSettings(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  })
}

export const usePublicSettings = () => {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => settingApi.getPublicSettings().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  })
}

export const useCreateSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: settingApi.createSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
      toast.success('تنظیم جدید با موفقیت ایجاد شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در ایجاد تنظیم')
    },
  })
}

export const useUpdateSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => settingApi.updateSetting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
      toast.success('تنظیم با موفقیت به‌روزرسانی شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در به‌روزرسانی تنظیم')
    },
  })
}

export const useDeleteSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: settingApi.deleteSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
      toast.success('تنظیم با موفقیت حذف شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در حذف تنظیم')
    },
  })
}

export const useBulkUpdateSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: settingApi.bulkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
      toast.success('تنظیمات دسته‌ای با موفقیت به‌روزرسانی شد')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'خطا در به‌روزرسانی دسته‌ای')
    },
  })
}