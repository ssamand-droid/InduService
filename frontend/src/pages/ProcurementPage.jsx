import { useCallback, useEffect, useState } from 'react'
import { FiBookOpen, FiCheckCircle, FiDollarSign, FiRefreshCw, FiShield, FiAlertCircle } from 'react-icons/fi'
import { Button, Card, Input, PageHeader, Spinner } from '@components/ui'
import { useAuthStore } from '@stores/authStore'
import procurementService from '@services/procurementService'

const rows = (response) => response.data?.results || response.data || []
const formatMoney = (amount, currency = 'IRR') => `${Number(amount || 0).toLocaleString('fa-IR')} ${currency}`
const labels = { submitted: 'ثبت‌شده', matched: 'تطبیق‌شده', disputed: 'مورد اختلاف', settled: 'تسویه‌شده', recorded: 'در انتظار تأیید', verified: 'تأیید و ثبت در دفترکل', reversed: 'برگشت‌خورده' }
const errorMessage = (error) => error.response?.data?.detail || error.response?.data?.amount?.[0] || error.response?.data?.error || 'درخواست ناموفق بود.'

export default function ProcurementPage() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'admin' || user?.is_staff
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [journals, setJournals] = useState([])
  const [paymentDraft, setPaymentDraft] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [invoiceRes, paymentRes, accountRes, journalRes] = await Promise.all([
        procurementService.invoices(), procurementService.payments(),
        procurementService.ledgerAccounts(), procurementService.ledgerJournals(),
      ])
      setInvoices(rows(invoiceRes)); setPayments(rows(paymentRes));
      setAccounts(rows(accountRes)); setJournals(rows(journalRes))
    } catch (err) { setError(errorMessage(err)) } finally { setLoading(false) }
  }, [])

  useEffect(() => { reload() }, [reload])

  const recordPayment = async (invoice) => {
    const draft = paymentDraft[invoice.id] || {}
    if (!draft.amount) return
    setBusyId(invoice.id); setError('')
    try {
      await procurementService.recordPayment({
        invoice: invoice.id,
        amount: draft.amount,
        reference: draft.reference || '',
        notes: draft.notes || '',
      })
      setPaymentDraft((current) => ({ ...current, [invoice.id]: { amount: '', reference: '', notes: '' } }))
      await reload()
    } catch (err) { setError(errorMessage(err)) } finally { setBusyId(null) }
  }

  const verifyPayment = async (payment) => {
    if (!window.confirm('تأیید پرداخت باعث ثبت سند دوطرفه در دفترکل خریدار و تأمین‌کننده می‌شود. پرداخت را خارج از سامانه بررسی کرده‌اید؟')) return
    setBusyId(payment.id); setError('')
    try { await procurementService.verifyPayment(payment.id); await reload() }
    catch (err) { setError(errorMessage(err)) }
    finally { setBusyId(null) }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <PageHeader title="تدارکات و دفترکل" description="فاکتورهای تأمین‌کننده، ثبت پرداخت و گردش اسناد مالی سازمان" actions={<Button variant="outline" onClick={reload}><FiRefreshCw className="ml-2" />به‌روزرسانی</Button>} />
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><FiAlertCircle className="ml-2 inline" />{error}</div>}

      <section className="space-y-4">
        <div className="flex items-center gap-2"><FiDollarSign className="text-primary-600" /><h2 className="text-lg font-bold">فاکتورها و پرداخت‌ها</h2></div>
        {invoices.length === 0 ? <Card><p className="py-5 text-center text-sm text-secondary-500">فاکتور تدارکاتی در سازمان شما ثبت نشده است.</p></Card> : invoices.map((invoice) => {
          const invoicePayments = payments.filter((payment) => String(payment.invoice) === String(invoice.id))
          const verified = invoicePayments.filter((payment) => payment.status === 'verified').reduce((sum, item) => sum + Number(item.amount), 0)
          const canRecord = !isAdmin && invoice.status === 'matched' && verified < Number(invoice.amount)
          return <Card key={invoice.id} padding="p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">فاکتور {invoice.invoice_number}</h3><span className="rounded-full bg-secondary-100 px-2 py-1 text-xs dark:bg-secondary-800">{labels[invoice.status] || invoice.status}</span></div><p className="mt-1 text-xs text-secondary-500">سفارش خرید {invoice.purchase_order} · سررسید {invoice.due_at || '—'}</p><p className="mt-2 text-lg font-bold text-primary-700 dark:text-primary-300">{formatMoney(invoice.amount, invoice.currency)}</p><p className="mt-1 text-xs text-secondary-500">تأییدشده: {formatMoney(verified, invoice.currency)}</p></div>
              <div className="min-w-0 md:max-w-[55%]"><p className="mb-2 text-xs font-semibold text-secondary-500">سوابق پرداخت</p>{invoicePayments.length === 0 ? <p className="text-sm text-secondary-400">پرداختی ثبت نشده</p> : <div className="space-y-2">{invoicePayments.map((payment) => <div key={payment.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary-50 px-3 py-2 text-xs dark:bg-secondary-900"><span className="font-medium">{formatMoney(payment.amount, invoice.currency)}</span><span className="text-secondary-500">{labels[payment.status] || payment.status}</span>{payment.reference && <span>· {payment.reference}</span>}{isAdmin && payment.status === 'recorded' && <Button size="xs" variant="success" isLoading={busyId === payment.id} onClick={() => verifyPayment(payment)}><FiCheckCircle className="ml-1" />تأیید و ثبت سند</Button>}</div>)}</div>}</div>
            </div>
            {canRecord && <div className="mt-4 grid gap-3 border-t border-secondary-100 pt-4 sm:grid-cols-[1fr_1fr_auto] dark:border-secondary-700"><Input type="number" min="0.01" step="0.01" placeholder="مبلغ پرداخت" value={paymentDraft[invoice.id]?.amount || ''} onChange={(event) => setPaymentDraft((current) => ({ ...current, [invoice.id]: { ...current[invoice.id], amount: event.target.value } }))} /><Input placeholder="کد پیگیری یا مرجع بانکی" value={paymentDraft[invoice.id]?.reference || ''} onChange={(event) => setPaymentDraft((current) => ({ ...current, [invoice.id]: { ...current[invoice.id], reference: event.target.value } }))} /><Button isLoading={busyId === invoice.id} onClick={() => recordPayment(invoice)}>ثبت پرداخت</Button></div>}
          </Card>
        })}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><FiBookOpen className="text-primary-600" /><h2 className="text-lg font-bold">دفترکل سازمان</h2></div>
        {accounts.length === 0 && journals.length === 0 ? <Card><p className="py-4 text-center text-sm text-secondary-500">سند دفترکل ثبت نشده است. پرداخت پس از تأیید مدیر به‌صورت دوطرفه ثبت می‌شود.</p></Card> : <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{accounts.map((account) => <Card key={account.id} padding="p-4"><p className="text-xs text-secondary-500">{account.name} · {account.code}</p><p className="mt-2 text-xl font-bold">{formatMoney(account.balance, account.currency)}</p></Card>)}</div>
          <div className="space-y-3">{journals.map((journal) => <Card key={journal.id} padding="p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{journal.memo}</p><p className="mt-1 text-xs text-secondary-500">{journal.organization_name} · {new Date(journal.posted_at).toLocaleString('fa-IR')}</p></div><span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700 dark:bg-green-950/30 dark:text-green-300">ثبت نهایی</span></div><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-right text-xs"><thead className="text-secondary-500"><tr><th className="py-2">حساب</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th></tr></thead><tbody>{journal.entries.map((entry) => <tr key={entry.id} className="border-t border-secondary-100 dark:border-secondary-800"><td className="py-2">{entry.account_name}</td><td>{entry.description}</td><td>{Number(entry.debit) ? formatMoney(entry.debit, journal.currency) : '—'}</td><td>{Number(entry.credit) ? formatMoney(entry.credit, journal.currency) : '—'}</td></tr>)}</tbody></table></div></Card>)}</div>
        </>}
      </section>
      {isAdmin && <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><FiShield className="mt-0.5 shrink-0" />پیش از تأیید، رسید یا مرجع بانکی را خارج از سامانه کنترل کنید. تأیید، سند دفترکل خریدار و تأمین‌کننده را ثبت می‌کند.</div>}
    </div>
  )
}
