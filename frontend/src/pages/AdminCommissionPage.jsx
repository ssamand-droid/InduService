// src/pages/AdminCommissionPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSave } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Modal } from '@components/ui'
import api from '@lib/axios'
import toast from 'react-hot-toast'

export default function AdminCommissionPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({
    rule_type: 'default', service_scenario: '', commission_rate: 12.0,
    advance_payment_rate: 0, min_commission: 0, max_commission: 0, is_active: true,
  })
  const queryClient = useQueryClient()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: () => api.get('/api/payment/commission-rules/').then(res => res.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => editingRule
      ? api.patch(`/api/payment/commission-rules/${editingRule.id}/`, data)
      : api.post('/api/payment/commission-rules/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] })
      toast.success('قانون ذخیره شد')
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/payment/commission-rules/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] })
      toast.success('قانون حذف شد')
    },
  })

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setFormData({
      rule_type: rule.rule_type, service_scenario: rule.service_scenario || '',
      commission_rate: rule.commission_rate, advance_payment_rate: rule.advance_payment_rate,
      min_commission: rule.min_commission, max_commission: rule.max_commission,
      is_active: rule.is_active,
    })
    setShowForm(true)
  }

  const handleClose = () => { setShowForm(false); setEditingRule(null) }

  if (isLoading) return <Spinner />

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="heading-2">مدیریت کمیسیون و پیش‌پرداخت</h1>
        <Button variant="primary" onClick={() => { setEditingRule(null); setShowForm(true) }}>
          <FiPlus className="ml-1" /> قانون جدید
        </Button>
      </div>

      <Card>
        <table className="w-full">
          <thead className="bg-secondary-50">
            <tr className="text-sm">
              <th className="p-3">نوع</th><th className="p-3">سناریو</th>
              <th className="p-3">کمیسیون %</th><th className="p-3">پیش‌پرداخت %</th>
              <th className="p-3">حداقل</th><th className="p-3">حداکثر</th>
              <th className="p-3">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rules?.results?.map(rule => (
              <tr key={rule.id} className="text-sm">
                <td className="p-3"><Badge>{rule.rule_type}</Badge></td>
                <td className="p-3">{rule.service_scenario || '---'}</td>
                <td className="p-3 font-bold text-primary-600">{rule.commission_rate}%</td>
                <td className="p-3">{rule.advance_payment_rate}%</td>
                <td className="p-3">{rule.min_commission.toLocaleString()}</td>
                <td className="p-3">{rule.max_commission.toLocaleString()}</td>
                <td className="p-3">
                  <Button variant="ghost" size="xs" onClick={() => handleEdit(rule)}><FiEdit2 /></Button>
                  <Button variant="ghost" size="xs" onClick={() => deleteMutation.mutate(rule.id)}><FiTrash2 className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={showForm} onClose={handleClose} title={editingRule ? 'ویرایش قانون' : 'قانون جدید'} size="md">
        <div className="space-y-4">
          <select value={formData.rule_type} onChange={e => setFormData({...formData, rule_type: e.target.value})}
            className="w-full border rounded p-2">
            <option value="default">پیش‌فرض</option>
            <option value="scenario">سناریو</option>
            <option value="service">خدمت خاص</option>
            <option value="category">دسته‌بندی</option>
          </select>
          {formData.rule_type === 'scenario' && (
            <input type="text" value={formData.service_scenario} onChange={e => setFormData({...formData, service_scenario: e.target.value})}
              className="w-full border rounded p-2" placeholder="کد سناریو" />
          )}
          <input type="number" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: parseFloat(e.target.value)})}
            className="w-full border rounded p-2" placeholder="درصد کمیسیون" />
          <input type="number" value={formData.advance_payment_rate} onChange={e => setFormData({...formData, advance_payment_rate: parseFloat(e.target.value)})}
            className="w-full border rounded p-2" placeholder="درصد پیش‌پرداخت" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={handleClose}>انصراف</Button>
          <Button variant="primary" onClick={() => saveMutation.mutate(formData)} isLoading={saveMutation.isPending}>
            <FiSave className="ml-1" /> ذخیره
          </Button>
        </div>
      </Modal>
    </div>
  )
}