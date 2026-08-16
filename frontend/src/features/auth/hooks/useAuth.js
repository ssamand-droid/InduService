// src/features/auth/hooks/useAuth.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@stores/authStore'
import { authApi } from '../services/authApi'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, login, logout } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: ({ phone_number, password }) => authApi.login(phone_number, password),
    onSuccess: async (data) => {
      const { access, refresh } = data
      useAuthStore.getState().setTokens(access, refresh)
      try {
        const userData = await authApi.getCurrentUser()
        login(userData, access, refresh)
        toast.success('خوش آمدید!')
        navigate('/dashboard')
      } catch (error) {
        toast.error('خطا در دریافت اطلاعات کاربر')
      }
    },
    onError: () => toast.error('شماره موبایل یا رمز عبور اشتباه است'),
  })

  // ========================
  // Register
  // ========================
  const registerMutation = useMutation({
    mutationFn: (userData) => authApi.register(userData),
    onSuccess: (data) => {
      toast.success('ثبت‌نام با موفقیت انجام شد! لطفاً وارد شوید')
      navigate('/login')
    },
    onError: (error) => {
      const message = error.response?.data?.error?.details || error.response?.data?.message || 'خطا در ثبت‌نام'
      toast.error(message)
    },
  })

  // ========================
  // Update Profile - اصلاح شده
  // ========================
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: async (data) => {
      // ========== اصلاح: دریافت مجدد اطلاعات کاربر ==========
      try {
        const userData = await authApi.getCurrentUser()
        useAuthStore.getState().setUser(userData)
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        toast.success('پروفایل با موفقیت بروزرسانی شد')
      } catch (error) {
        toast.error('خطا در دریافت اطلاعات کاربر')
      }
    },
    onError: (error) => toast.error(error.userMessage || 'خطا در بروزرسانی پروفایل'),
  })

  // ========================
  // Upload Avatar - اصلاح شده
  // ========================
  const uploadAvatarMutation = useMutation({
    mutationFn: authApi.uploadAvatar,
    onSuccess: async (data) => {
      // ========== اصلاح: دریافت مجدد اطلاعات کاربر ==========
      try {
        const userData = await authApi.getCurrentUser()
        useAuthStore.getState().setUser(userData)
        toast.success('تصویر پروفایل آپلود شد')
      } catch (error) {
        toast.error('خطا در دریافت اطلاعات کاربر')
      }
    },
    onError: () => toast.error('خطا در آپلود تصویر'),
  })

  // ========================
  // Logout
  // ========================
  const logoutMutation = useMutation({
    mutationFn: async () => { logout(); queryClient.clear(); },
    onSuccess: () => { toast.success('با موفقیت خارج شدید'); navigate('/'); },
  })

  // ========================
  // Change Password
  // ========================
  const changePasswordMutation = useMutation({
    mutationFn: ({ old_password, new_password }) => authApi.changePassword(old_password, new_password),
    onSuccess: () => toast.success('رمز عبور با موفقیت تغییر کرد'),
    onError: (error) => toast.error(error.userMessage || 'خطا در تغییر رمز عبور'),
  })

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    logout: logoutMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
  }
}