// src/pages/AdminSettingsPage.jsx - نسخه اصلاح شده

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSave, FiPlus, FiTrash2, FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Modal } from '@components/ui'
import api from '@lib/axios'
import toast from 'react-hot-toast'

// ============================================================
// کامپوننت ToggleSwitch
// ============================================================
const ToggleSwitch = ({ settingKey, defaultValue = true }) => {
  const queryClient = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => api.get('/api/settings/').then(res => res.data),
  })

  const setting = settings?.results?.find(s => s.key === settingKey)
  const isEnabled = setting ? setting.value === 'true' : defaultValue

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/api/settings/${setting?.id}/`, { value: isEnabled ? 'false' : 'true' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      toast.success('تنظیمات ذخیره شد')
    },
  })

  if (!setting) {
    return (
      <div className="text-sm text-gray-400">
        تنظیمات یافت نشد
      </div>
    )
  }

  return (
    <button
      onClick={() => updateMutation.mutate()}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
        isEnabled
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      disabled={updateMutation.isPending}
    >
      {isEnabled ? (
        <FiToggleRight className="h-5 w-5 text-green-600" />
      ) : (
        <FiToggleLeft className="h-5 w-5 text-gray-500" />
      )}
      {isEnabled ? 'فعال' : 'غیرفعال'}
    </button>
  )
}


export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSetting, setNewSetting] = useState({ key: '', value: '', title: '', setting_type: 'general' })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => api.get('/api/settings/').then(res => res.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/api/settings/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      toast.success('تنظیمات ذخیره شد')
      setEditingKey(null)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/settings/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      toast.success('تنظیم جدید اضافه شد')
      setShowAddModal(false)
      setNewSetting({ key: '', value: '', title: '', setting_type: 'general' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/settings/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      toast.success('تنظیم حذف شد')
    },
  })

  if (isLoading) return <Spinner />

  const typeLabels = {
    general: '⚙️ عمومی',
    commission: '💰 کمیسیون',
    payment: '💳 پرداخت',
    seo: '🔍 SEO',
    notification: '🔔 اعلان‌ها'
  }
  const typeColors = {
    general: 'secondary',
    commission: 'warning',
    payment: 'info',
    seo: 'primary',
    notification: 'success'
  }

  // ✅ لیست تنظیمات Matching (برای نمایش در بخش اول)
  const matchingKeys = ['MATCHING_DIRECT_PROVIDER', 'MATCHING_SCENARIO_PROVIDERS', 'MATCHING_ENGINE_ADVANCED']

  // ✅ همه تنظیمات
  const allSettings = settings?.results || []

  // ✅ تنظیمات Matching
  const matchingSettings = allSettings.filter(s => matchingKeys.includes(s.key))

  // ✅ سایر تنظیمات (همه تنظیمات به جز Matching)
  const otherSettings = allSettings.filter(s => !matchingKeys.includes(s.key))

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="heading-2">تنظیمات پلتفرم</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <FiPlus className="ml-1" /> تنظیم جدید
        </Button>
      </div>

      {/* ============================================================
          بخش تنظیمات ارسال درخواست به ارائه‌دهندگان
      ============================================================ */}
      <Card>
        <div className="p-4 md:p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            🎯 تنظیمات ارسال درخواست به ارائه‌دهندگان
          </h3>
          <div className="space-y-4">
            {/* گزینه 1: ارائه‌دهنده مستقیم */}
            <div className="flex items-center justify-between flex-wrap gap-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <div>
                <h4 className="font-medium">ارسال به ارائه‌دهنده مستقیم</h4>
                <p className="text-sm text-secondary-500">درخواست به ارائه‌دهنده‌ای که سرویس را ثبت کرده ارسال می‌شود</p>
              </div>
              <ToggleSwitch settingKey="MATCHING_DIRECT_PROVIDER" defaultValue={true} />
            </div>

            {/* گزینه 2: ارائه‌دهندگان سناریو مرتبط */}
            <div className="flex items-center justify-between flex-wrap gap-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <div>
                <h4 className="font-medium">ارسال به ارائه‌دهندگان سناریو مرتبط</h4>
                <p className="text-sm text-secondary-500">درخواست به ارائه‌دهندگانی که سناریوی مشابه دارند ارسال می‌شود</p>
              </div>
              <ToggleSwitch settingKey="MATCHING_SCENARIO_PROVIDERS" defaultValue={true} />
            </div>

            {/* گزینه 3: Matching Engine پیشرفته */}
            <div className="flex items-center justify-between flex-wrap gap-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <div>
                <h4 className="font-medium">Matching Engine پیشرفته (۳ نفر برتر)</h4>
                <p className="text-sm text-secondary-500">انتخاب ۳ ارائه‌دهنده برتر بر اساس امتیاز، تخصص، موقعیت و زمان پاسخ</p>
              </div>
              <ToggleSwitch settingKey="MATCHING_ENGINE_ADVANCED" defaultValue={false} />
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================
          سایر تنظیمات - نمایش تمام تنظیمات به جز Matching
      ============================================================ */}
      <Card>
        <div className="p-4 md:p-6">
          <h3 className="font-semibold mb-4">سایر تنظیمات</h3>
          {otherSettings.length === 0 ? (
            <p className="text-secondary-500 text-center py-8">تنظیمی یافت نشد</p>
          ) : (
            <div className="space-y-2">
              {otherSettings.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <Badge variant={typeColors[item.setting_type] || 'secondary'} size="sm">
                    {typeLabels[item.setting_type] || item.setting_type}
                  </Badge>
                  <span className="font-medium flex-1 text-sm">{item.title || item.key}</span>

                  {editingKey === item.id ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 border rounded p-1.5 text-sm dark:bg-secondary-800 dark:text-white"
                      />
                      <Button variant="primary" size="xs" onClick={() => updateMutation.mutate({ id: item.id, data: { value: editValue } })}>
                        <FiSave className="ml-1" /> ذخیره
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setEditingKey(null)}>انصراف</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <code className="bg-secondary-100 dark:bg-secondary-700 px-3 py-1 rounded text-sm flex-1 sm:flex-none truncate max-w-[200px]">
                        {item.value}
                      </code>
                      <Button variant="ghost" size="xs" onClick={() => { setEditingKey(item.id); setEditValue(item.value); }}>
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(item.id); }}>
                        <FiTrash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="تنظیم جدید" size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>انصراف</Button>
            <Button variant="primary" onClick={() => createMutation.mutate(newSetting)} isLoading={createMutation.isPending}>ایجاد</Button>
          </>
        }>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">کلید (Key) *</label>
            <input
              type="text"
              value={newSetting.key}
              onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
              className="w-full border rounded p-2 dark:bg-secondary-800 dark:text-white"
              placeholder="مثلاً COMMISSION_RATE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">مقدار (Value) *</label>
            <input
              type="text"
              value={newSetting.value}
              onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
              className="w-full border rounded p-2 dark:bg-secondary-800 dark:text-white"
              placeholder="مثلاً 12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">عنوان فارسی</label>
            <input
              type="text"
              value={newSetting.title}
              onChange={(e) => setNewSetting({ ...newSetting, title: e.target.value })}
              className="w-full border rounded p-2 dark:bg-secondary-800 dark:text-white"
              placeholder="توضیح فارسی تنظیم"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">نوع</label>
            <select
              value={newSetting.setting_type}
              onChange={(e) => setNewSetting({ ...newSetting, setting_type: e.target.value })}
              className="w-full border rounded p-2 dark:bg-secondary-800"
            >
              <option value="general">⚙️ عمومی</option>
              <option value="commission">💰 کمیسیون</option>
              <option value="payment">💳 پرداخت</option>
              <option value="seo">🔍 SEO</option>
              <option value="notification">🔔 اعلان‌ها</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}