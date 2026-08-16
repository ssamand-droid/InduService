// frontend/src/pages/WalletPage.jsx - نسخه امن (بدون toLocaleString)

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiDollarSign, FiArrowDown, FiArrowUp, FiClock, FiSend } from 'react-icons/fi'
import api from '@lib/axios'

// تابع ساده و امن برای فرمت عدد (بدون toLocaleString)
const safeFormatNumber = (num) => {
  if (num === undefined || num === null) return '۰'
  const str = Math.floor(Number(num)).toString()
  // اضافه کردن جداکننده هزارگان به صورت دستی
  let result = ''
  for (let i = str.length - 1; i >= 0; i--) {
    result = str[i] + result
    if ((str.length - i) % 3 === 0 && i !== 0) {
      result = ',' + result
    }
  }
  return result + ' ریال'
}

// تابع ساده برای فرمت تاریخ (بدون toLocaleDateString)
const safeFormatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

export default function WalletPage() {
  const navigate = useNavigate()

  const { data: wallet, isLoading, error } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: () => api.get('/api/payment/wallets/my_wallet/').then(r => r.data),
    retry: 1,
  })

  const { data: transactions } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => api.get('/api/payment/wallets/transactions/').then(r => r.data),
    retry: 1,
  })

  // نمایش لودینگ با HTML/CSS خالص
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '12px', color: '#6b7280' }}>در حال بارگذاری کیف پول...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // نمایش خطا
  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#fee2e2', borderRadius: '16px', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: '#dc2626', fontWeight: '500' }}>خطا در دریافت اطلاعات</p>
          <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>لطفاً دوباره تلاش کنید</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  const w = wallet || {}
  const txs = transactions?.results || transactions || []
  const availableBalance = Number(w.available_balance) || 0
  const totalBalance = Number(w.balance) || 0
  const frozenBalance = Number(w.frozen_balance) || 0

  const txTypeLabels = {
    deposit: 'واریز',
    withdrawal: 'برداشت',
    commission: 'کمیسیون',
    payment: 'پرداخت خدمت',
    refund: 'بازگشت وجه',
    advance: 'پیش‌پرداخت',
  }

  const isPositive = (type) => ['deposit', 'payment', 'refund', 'advance'].includes(type)

  return (
    <div style={{ padding: '32px 16px', maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>کیف پول من</h1>

      {/* کارت موجودی */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb, #1e3a8a)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '32px', textAlign: 'center', color: 'white' }}>
          <FiDollarSign style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.8 }} />
          <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>{safeFormatNumber(availableBalance)}</p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>موجودی قابل برداشت</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '16px', textAlign: 'center', color: 'white', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>موجودی کل</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{safeFormatNumber(totalBalance)}</p>
          </div>
          <div style={{ padding: '16px', textAlign: 'center', color: 'white' }}>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>مسدود شده</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{safeFormatNumber(frozenBalance)}</p>
          </div>
        </div>
      </div>

      {/* دکمه تسویه حساب */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '24px', textAlign: 'center', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <button
          onClick={() => navigate('/settlement')}
          disabled={availableBalance <= 0}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: availableBalance > 0 ? '#2563eb' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '500',
            cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <FiSend size={18} />
          درخواست تسویه حساب
        </button>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          موجودی قابل برداشت: {safeFormatNumber(availableBalance)}
        </p>
      </div>

      {/* تاریخچه تراکنش‌ها */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontWeight: '600', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiClock style={{ color: '#2563eb' }} size={18} />
          تاریخچه تراکنش‌ها
        </h3>

        {txs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
            <p style={{ color: '#6b7280' }}>هیچ تراکنشی یافت نشد</p>
          </div>
        ) : (
          <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
            {txs.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isPositive(tx.transaction_type) ? (
                    <FiArrowDown style={{ color: '#22c55e' }} size={20} />
                  ) : (
                    <FiArrowUp style={{ color: '#ef4444' }} size={20} />
                  )}
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                      {tx.description || txTypeLabels[tx.transaction_type] || tx.transaction_type}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{safeFormatDate(tx.created_at)}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold', color: isPositive(tx.transaction_type) ? '#16a34a' : '#dc2626' }}>
                    {isPositive(tx.transaction_type) ? '+' : '-'}{safeFormatNumber(tx.amount)}
                  </p>
                  <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '10px', borderRadius: '9999px', backgroundColor: '#e5e7eb', color: '#4b5563' }}>
                    {txTypeLabels[tx.transaction_type] || tx.transaction_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}