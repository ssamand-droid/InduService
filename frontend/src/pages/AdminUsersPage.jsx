// src/pages/AdminUsersPage.jsx - نسخه نهایی موبایل فرندلی
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiCheck, FiX, FiUserCheck, FiEdit3 } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Input, Alert } from '@components/ui'
import { useAuthStore } from '@stores/authStore'
import api from '@lib/axios'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  buyer: 'مدیر کارخانه', technician: 'تکنسین فنی',
  maintenance_manager: 'مدیر نت', procurement: 'بازرگانی',
  seller: 'فروشنده', service_provider: 'خدمات‌دهنده',
  company_seller: 'شرکت فروشنده', company_provider: 'شرکت خدمات‌دهنده',
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
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [impersonatingId, setImpersonatingId] = useState(null)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin-users/').then(res => res.data),
    staleTime: 30000,
  })

  const updateUserMutation = useMutation({
    mutationFn: (data) => api.patch('/api/admin-users/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('عملیات با موفقیت انجام شد')
    },
  })

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

  if (error) return <Alert variant="error" className="m-6">خطا در دریافت کاربران</Alert>
  if (isLoading) return <Spinner className="mt-12" />

  const userList = users || []
  const filteredUsers = userList.filter(u => {
    const matchSearch = !search ||
      u.phone_number?.includes(search) ||
      `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="primary">{userList.length} کاربر</Badge>
          <Badge variant="info">{userList.filter(u => BUYER_ROLES.includes(u.role)).length} دریافت‌کننده</Badge>
          <Badge variant="success">{userList.filter(u => PROVIDER_ROLES.includes(u.role)).length} خدمات‌دهنده</Badge>
        </div>
      </div>

      {/* فیلترها */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="جستجو نام، موبایل ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<FiSearch />}
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded-lg p-3 text-sm">
            <option value="">همه نقش‌ها</option>
            {/* optgroup ها مثل قبل */}
          </select>
        </div>
      </Card>

      {/* جدول */}
      <Card>
        <div className="table-responsive">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr className="text-right">
                <th className="p-3">کاربر</th>
                <th className="p-3 hidden sm:table-cell">موبایل</th>
                <th className="p-3">نقش</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-gray-500">کاربری یافت نشد</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-gray-500 sm:hidden mt-1">{user.phone_number}</div>
                    </td>
                    <td className="p-3 hidden sm:table-cell font-mono">{user.phone_number}</td>
                    <td className="p-3">
                      <Badge variant={ROLE_COLORS[user.role] || 'secondary'}>{ROLE_LABELS[user.role]}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.is_active ? "success" : "danger"}>
                        {user.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {/* جعل هویت */}
                        {user.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleImpersonate(user.id)}
                            isLoading={impersonatingId === user.id}
                            title="جعل هویت"
                          >
                            <FiUserCheck className="text-purple-600" />
                          </Button>
                        )}

                        {/* فعال/غیرفعال */}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleAction(user.id, 'toggle_active')}
                          title={user.is_active ? "غیرفعال کردن" : "فعال کردن"}
                        >
                          {user.is_active ? <FiX className="text-red-600" /> : <FiCheck className="text-green-600" />}
                        </Button>

                        {/* تایید کاربر */}
                        {!user.is_verified && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(user.id, 'verify')}
                            title="تایید کاربر"
                          >
                            <FiCheck className="text-blue-600" />
                          </Button>
                        )}

                        {/* تغییر نقش */}
                        <select
                          value={user.role}
                          onChange={(e) => handleAction(user.id, 'change_role', e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white dark:bg-gray-800"
                        >
                          {[...BUYER_ROLES, ...PROVIDER_ROLES, 'admin'].map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
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