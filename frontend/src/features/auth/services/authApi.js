import api from '@lib/axios'

export const authApi = {
  register: async (userData) => {
    const response = await api.post('/api/users/register/', userData)
    return response.data
  },

  login: async (phone_number, password) => {
    const response = await api.post('/api/token/', { phone_number, password })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me/')
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.patch('/api/users/profile/', profileData)
    return response.data
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/api/users/change_password/', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return response.data
  },

  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post('/api/users/upload_avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
    /**
   * ثبت‌نام مرحله اول: موبایل + رمز + نقش
   */
  registerStep1: async (data) => {
    const response = await api.post('/api/users/register_step1/', data)
    return response.data
  },

  /**
   * ثبت‌نام مرحله دوم: تکمیل پروفایل
   */
  registerStep2: async (data) => {
    const response = await api.post('/api/users/register_step2/', data)
    return response.data
  },
}