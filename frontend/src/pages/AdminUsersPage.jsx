// src/pages/AdminUsersPage.jsx - نسخه نهایی (کاملاً تست شده)

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiCheck, FiX, FiUserCheck } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Input, Alert } from '@components/ui'
import { useAuthStore } from '@stores/authStore'
import api from '@lib/axios'
import toast from 'react-hot-toast'
import { formatDate } from '@lib/utils'

const ROLE_LABELS = {
  buyer: 'مدیر کارخانه', technician: 'تکنسین فنی',
  maintenance_manager: 'مدیر نت', procurement: 'بازرگانی/تدارکات',
  seller: 'فروشنده (حقیقی)', service_provider: 'خدمات‌دهنده (حقیقی)',
  company_seller: 'شرکت فروشنده (حقوقی)', company_provider: 'شرکت خدمات‌دهنده (حقوقی)',
  admin: 'مدیر سیستم',
}

const ROLE_COLORS = {
  buyer: 'primary', technician: 'info', maintenance_manager: 'success',
  procurement: 'warning', seller: 'info', service_provider: 'primary',
  company_seller: 'secondary', company_provider: 'secondary', admin: 'danger',
}

const BUYER_ROLES = ['buyer', 'technician', 'maintenance_manager', 'procurement']
const PROVIDER_ROLES = ['seller', 'service_provider', 'company_seller', 'company_provider']

export default function AdminUsersPage() {
  // ========================
  // ALL hooks at the top
  // ========================
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [impersonatingId, setImpersonatingId] = useState(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin-users/').then(res => res.data),
    retry: false,
    staleTime: 30000,
  })

  const updateUserMutation = useMutation({
    mutationFn: (data) => api.patch('/api/admin-users/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('انجام شد')
    },
  })

  // ========================
  // Handlers with useCallback
  // ========================
  const handleAction = useCallback((userId, action, role = null) => {
    updateUserMutation.mutate({ user_id: userId, action, role })
  }, [updateUserMutation])

  const handleImpersonate = useCallback(async (userId) => {
    setImpersonatingId(userId)
    try {
      const response = await api.post(`/api/users/${userId}/impersonate/`)
      const { access, refresh, user: impersonatedUser } = response.data
      
      // ✅ استفاده از getState به جای استفاده مستقیم از هوک
      const currentState = useAuthStore.getState()
      localStorage.setItem('admin_impersonate', JSON.stringify({
        adminUser: currentState.user,
        adminToken: currentState.accessToken,
        adminRefresh: currentState.refreshToken,
      }))
      
      // ✅ فراخوانی متد login
      useAuthStore.getState().login(impersonatedUser, access, refresh)
      toast.success(`✅ وارد حساب ${impersonatedUser.full_name} شدید`)
      navigate('/dashboard')
    } catch {
      toast.error('خطا در جعل هویت')
    } finally {
      setImpersonatingId(null)
    }
  }, [navigate])

  // ========================
  // Early returns - AFTER all hooks
  // ========================
  if (error) {
    return <div className="p-6"><Alert variant="error">خطا در دریافت اطلاعات کاربران</Alert></div>
  }

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
  }

  const userList = users || []

  const filteredUsers = userList.filter(u => {
    const matchSearch = !search ||
      u.phone_number?.includes(search) ||
      u.first_name?.includes(search) ||
      u.last_name?.includes(search)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const buyerCount = userList.filter(u => BUYER_ROLES.includes(u.role)).length
  const providerCount = userList.filter(u => PROVIDER_ROLES.includes(u.role)).length

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="heading-2">مدیریت کاربران</h1>
        <div className="flex items-center gap-2">
          <Badge variant="primary">{userList.length} کاربر</Badge>
          <Badge variant="info">{buyerCount} دریافت‌کننده</Badge>
          <Badge variant="success">{providerCount} خدمات‌دهنده</Badge>
        </div>
      </div>

      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <Input placeholder="جستجوی کاربر..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<FiSearch />} className="flex-1" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border rounded p-2 dark:bg-secondary-800 text-sm">
            <option value="">همه نقش‌ها</option>
            <optgroup label="🏭 دریافت‌کننده">{BUYER_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</optgroup>
            <optgroup label="🔧 خدمات‌دهنده">{PROVIDER_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</optgroup>
            <option value="admin">{ROLE_LABELS.admin}</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr className="text-right text-sm font-medium text-secondary-500">
                <th className="p-3">کاربر</th>
                <th className="p-3 hidden sm:table-cell">موبایل</th>
                <th className="p-3">نقش</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-secondary-500">کاربری یافت نشد</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="text-sm hover:bg-secondary-50">
                    <td className="p-3">
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-secondary-500 sm:hidden">{user.phone_number}</p>
                    </td>
                    <td className="p-3 hidden sm:table-cell">{user.phone_number}</td>
                    <td className="p-3">
                      <Badge variant={ROLE_COLORS[user.role] || 'secondary'} size="sm">{ROLE_LABELS[user.role] || user.role}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">{user.is_active ? 'فعال' : 'غیرفعال'}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {user.role !== 'admin' && (
                          <Button variant="ghost" size="xs" onClick={() => handleImpersonate(user.id)} isLoading={impersonatingId === user.id} title="جعل هویت">
                            <FiUserCheck className="h-4 w-4 text-purple-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => handleAction(user.id, 'toggle_active')}>
                          {user.is_active ? <FiX className="text-red-500" /> : <FiCheck className="text-green-500" />}
                        </Button>
                        {!user.is_verified && (
                          <Button variant="ghost" size="xs" onClick={() => handleAction(user.id, 'verify')}>
                            <FiCheck className="text-blue-500" />
                          </Button>
                        )}
                        <select value={user.role} onChange={(e) => handleAction(user.id, 'change_role', e.target.value)} className="text-xs border rounded p-1 dark:bg-secondary-800 max-w-[100px]">
                          <optgroup label="دریافت‌کننده">{BUYER_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</optgroup>
                          <optgroup label="خدمات‌دهنده">{PROVIDER_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</optgroup>
                          <option value="admin">مدیر</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}