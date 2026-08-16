// src/pages/SettlementPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSend, FiDollarSign } from 'react-icons/fi'
import { Card, Spinner, Badge, Button, Modal } from '@components/ui'
import api from '@lib/axios'
import { formatPrice, formatDate } from '@lib/utils'
import toast from 'react-hot-toast'

export default function SettlementPage() {
  const [amount, setAmount] = useState('')
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: () => api.get('/api/payment/wallets/my_wallet/').then(r => r.data),
  })

  const { data: settlements, isLoading: settlementsLoading } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => api.get('/api/payment/settlements/').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/payment/settlements/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', 'my-wallet'] })
      toast.success('درخواست تسویه ثبت شد')
      setShowModal(false)
      setAmount('')
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'خطا در ثبت درخواست'
      toast.error(msg)
    },
  })

  const handleSettlement = () => {
    const num = parseInt(amount)
    if (!num || num <= 0) {
      toast.error('مبلغ را وارد کنید')
      return
    }
    if (num > (wallet?.available_balance || 0)) {
      toast.error('موجودی کافی نیست')
      return
    }
    createMutation.mutate({ amount: num })
  }

  if (walletLoading || settlementsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const statusLabels = { pending: 'در انتظار', approved: 'تایید شده', paid: 'پرداخت شده', rejected: 'رد شده' }
  const statusColors = { pending: 'warning', approved: 'info', paid: 'success', rejected: 'danger' }

  return (
    <div className="container-custom py-8 max-w-2xl mx-auto">
      <h1 className="heading-2 mb-6">تسویه حساب</h1>

      {/* Wallet Info */}
      <Card className="mb-6">
        <div className="p-6">
          <p className="text-secondary-500">موجودی قابل برداشت</p>
          <p className="text-3xl font-bold text-primary-600">{formatPrice(wallet?.available_balance || 0)}</p>
        </div>
      </Card>

      {/* Settlement Button */}
      <Card className="mb-6">
        <div className="p-6 text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowModal(true)}
            disabled={!wallet?.available_balance || wallet.available_balance <= 0}
          >
            <FiSend className="ml-2" /> درخواست تسویه حساب
          </Button>
          <p className="text-xs text-secondary-400 mt-2">
            موجودی قابل برداشت: {formatPrice(wallet?.available_balance || 0)}
          </p>
        </div>
      </Card>

      {/* Settlement History */}
      <Card>
        <div className="p-6">
          <h3 className="font-semibold mb-4">تاریخچه تسویه‌ها</h3>
          {!settlements?.results || settlements.results.length === 0 ? (
            <p className="text-secondary-500 text-center py-4">تسویه‌ای ثبت نشده</p>
          ) : (
            <div className="space-y-2">
              {settlements.results.map((s) => (
                <div key={s.id} className="flex justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded">
                  <div>
                    <p className="font-medium">{formatPrice(s.amount)}</p>
                    <p className="text-xs text-secondary-500">{s.bank_name} - {s.bank_account_number}</p>
                  </div>
                  <div className="text-left">
                    <Badge variant={statusColors[s.status]}>{statusLabels[s.status]}</Badge>
                    <p className="text-xs text-secondary-500 mt-1">{formatDate(s.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="درخواست تسویه حساب"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>انصراف</Button>
            <Button variant="primary" onClick={handleSettlement}
              isLoading={createMutation.isPending} disabled={!amount}>
              ثبت درخواست
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">مبلغ درخواستی (ریال)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded p-2.5 dark:bg-secondary-800 dark:text-white" placeholder="مبلغ را وارد کنید" />
          </div>
          <p className="text-sm text-secondary-500">موجودی قابل برداشت: {formatPrice(wallet?.available_balance || 0)}</p>

          {/* نمایش اطلاعات بانکی */}
          {wallet && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="font-medium mb-2">اطلاعات بانکی شما (از پروفایل):</p>
              <p className="text-secondary-600">برای ویرایش به پروفایل مراجعه کنید.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}