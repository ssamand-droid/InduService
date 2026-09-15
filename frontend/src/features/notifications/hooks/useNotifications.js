// src/features/notifications/hooks/useNotifications.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../services/notificationApi'
import { useAuthStore } from '@stores/authStore'

export const useNotifications = (page = 1) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationApi.getNotifications(page),
    keepPreviousData: true,
    enabled: !!isAuthenticated && !!accessToken,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })
}

export const useUnreadCount = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000,
    enabled: !!isAuthenticated && !!accessToken,
    retry: false,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationIds) => notificationApi.markAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    },
    onError: (error) => {
      console.error('Error marking as read:', error)
    },
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    },
    onError: (error) => {
      console.error('Error marking all as read:', error)
    },
  })
}