import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiActivity, FiAlertCircle, FiClock, FiFile, FiPlus, FiRefreshCw, FiTool, FiUpload } from 'react-icons/fi'
import { Button, Card, Input, PageHeader, Spinner, Textarea } from '@components/ui'
import { useAuthStore } from '@stores/authStore'
import serviceRequestService from '@services/serviceRequestService'
import workOrderService from '@services/workOrderService'

const statusLabels = {
  ready: 'آماده شروع', scheduled: 'زمان‌بندی‌شده', in_progress: 'در حال اجرا', blocked: 'متوقف',
  submitted: 'در انتظار تأیید', rework: 'نیازمند اصلاح', accepted: 'پذیرفته‌شده', cancelled: 'لغوشده',
}
const taskStatusLabels = { pending: 'در انتظار', in_progress: 'در حال اجرا', blocked: 'متوقف', done: 'انجام‌شده' }
const dateLabel = (date) => date ? new Date(date).toLocaleString('fa-IR') : '—'
const payload = (res) => res.data?.results || res.data || []
const errorText = (error) => error.response?.data?.detail || error.response?.data?.error || 'عملیات انجام نشد. دوباره تلاش کنید.'

export default function WorkOrdersPage() {
  const user = useAuthStore((state) => state.user)
  const isProvider = ['seller', 'service_provider', 'company_seller', 'company_provider'].includes(user?.role)
  const isAdmin = user?.role === 'admin' || user?.is_staff
  const [workOrders, setWorkOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [actionMode, setActionMode] = useState('')
  const [actionText, setActionText] = useState('')
  const [file, setFile] = useState(null)
  const [scheduledStart, setScheduledStart] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ordersRes, requestsRes] = await Promise.all([
        workOrderService.list(), serviceRequestService.getRequests(),
      ])
      const orders = payload(ordersRes)
      setWorkOrders(orders)
      setRequests(payload(requestsRes))
      setSelectedId((current) => orders.some((item) => item.id === current) ? current : orders[0]?.id || null)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const selected = useMemo(() => workOrders.find((item) => item.id === selectedId), [workOrders, selectedId])
  const existingRequestIds = useMemo(() => new Set(workOrders.map((item) => String(item.service_request))), [workOrders])
  const acceptedRequests = requests.filter((item) => item.status === 'accepted' && !existingRequestIds.has(String(item.id)))
  const canCreate = !isProvider || user?.role === 'buyer' || user?.role === 'procurement' || isAdmin
  const isCustomer = selected && String(selected.customer) === String(user?.id)
  const isAssignedProvider = selected && String(selected.provider) === String(user?.id)
  const canManage = isAdmin || isCustomer || isAssignedProvider

  const run = async (fn) => {
    setBusy(true); setError('')
    try { await fn(); await reload() } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  const createWorkOrder = (id) => run(async () => {
    const res = await workOrderService.createFromRequest(id)
    setSelectedId(res.data.id)
  })

  const transition = (status, extra = {}) => run(async () => {
    await workOrderService.transition(selected.id, { status, ...extra })
    setActionMode(''); setActionText('')
  })

  const submitAction = (event) => {
    event.preventDefault()
    if (!actionText.trim()) return
    if (actionMode === 'blocked') transition('blocked', { blocked_reason: actionText.trim() })
    if (actionMode === 'submitted') transition('submitted', { completion_report: actionText.trim() })
    if (actionMode === 'rework') transition('rework', { acceptance_notes: actionText.trim() })
  }

  const addTask = (event) => {
    event.preventDefault()
    if (!taskTitle.trim()) return
    run(async () => {
      await workOrderService.addTask(selected.id, { title: taskTitle.trim(), description: taskDescription.trim() })
      setTaskTitle(''); setTaskDescription('')
    })
  }

  const updateTask = (task, status) => run(() => workOrderService.updateTask(selected.id, task.id, { status }))

  const addEvidence = (event) => {
    event.preventDefault()
    if (!file) return
    run(async () => {
      const form = new FormData(); form.append('file', file); form.append('description', file.name)
      await workOrderService.addEvidence(selected.id, form); setFile(null)
      event.target.reset()
    })
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <PageHeader
        title="دستورکارها"
        description="پیگیری اجرای خدمت، وظایف تیم، موانع، گزارش پایان کار و تأیید مشتری"
        actions={<Button variant="outline" onClick={reload}><FiRefreshCw className="ml-2" />به‌روزرسانی</Button>}
      />
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><FiAlertCircle className="ml-2 inline" />{error}</div>}

      {canCreate && acceptedRequests.length > 0 && (
        <Card className="border-primary-200 dark:border-primary-900">
          <div className="mb-3 flex items-center gap-2 font-semibold"><FiPlus className="text-primary-600" />ایجاد دستورکار از خدمت پذیرفته‌شده</div>
          <div className="grid gap-3 md:grid-cols-2">
            {acceptedRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-900">
                <div className="min-w-0"><p className="truncate font-medium">{request.title}</p><p className="mt-1 text-xs text-secondary-500">درخواست {request.id} · {request.provider_name || 'ارائه‌دهنده انتخاب‌شده'}</p></div>
                <Button size="sm" isLoading={busy} onClick={() => createWorkOrder(request.id)}>ساخت دستورکار</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.7fr)]">
        <Card padding="p-0" className="overflow-hidden">
          <div className="border-b border-secondary-200 px-5 py-4 dark:border-secondary-700"><h2 className="font-semibold">فهرست دستورکارها</h2><p className="mt-1 text-xs text-secondary-500">{workOrders.length} مورد</p></div>
          {workOrders.length === 0 ? <div className="p-8 text-center text-sm text-secondary-500"><FiTool className="mx-auto mb-3 h-8 w-8" />هنوز دستورکاری ثبت نشده است.</div> : (
            <div className="max-h-[70vh] divide-y divide-secondary-100 overflow-y-auto dark:divide-secondary-800">
              {workOrders.map((item) => (
                <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full p-4 text-right transition hover:bg-secondary-50 dark:hover:bg-secondary-900 ${selectedId === item.id ? 'border-r-4 border-primary-600 bg-primary-50/70 dark:bg-primary-950/20' : ''}`}>
                  <div className="flex items-start justify-between gap-2"><span className="line-clamp-2 font-medium">{item.scope_snapshot?.title || `دستورکار ${String(item.id).slice(0, 8)}`}</span><span className="shrink-0 rounded-full bg-secondary-100 px-2 py-1 text-xs dark:bg-secondary-800">{statusLabels[item.status] || item.status}</span></div>
                  <p className="mt-2 text-xs text-secondary-500">ثبت {dateLabel(item.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {selected ? (
          <div className="space-y-5">
            <Card>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div><div className="mb-2 flex items-center gap-2"><FiActivity className="text-primary-600" /><span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">{statusLabels[selected.status]}</span></div><h2 className="text-xl font-bold">{selected.scope_snapshot?.title}</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-secondary-600 dark:text-secondary-300">{selected.scope_snapshot?.description}</p><p className="mt-3 text-xs text-secondary-500">کد درخواست: {selected.service_request} · شروع: {dateLabel(selected.started_at)}</p></div>
                <div className="flex flex-wrap gap-2">
                  {isAssignedProvider && selected.status === 'ready' && <div className="flex items-center gap-2"><input aria-label="زمان شروع" type="datetime-local" value={scheduledStart} onChange={(event) => setScheduledStart(event.target.value)} className="rounded-lg border border-secondary-300 bg-white px-2 py-2 text-xs dark:border-secondary-600 dark:bg-secondary-800" /><Button size="sm" variant="outline" disabled={!scheduledStart} isLoading={busy} onClick={() => transition('scheduled', { scheduled_start: new Date(scheduledStart).toISOString() })}>زمان‌بندی</Button></div>}
                  {isAssignedProvider && ['ready','scheduled','blocked','rework'].includes(selected.status) && <Button size="sm" variant="success" isLoading={busy} onClick={() => transition('in_progress')}>{['blocked','rework'].includes(selected.status) ? 'ادامه اجرا' : 'شروع اجرا'}</Button>}
                  {isAssignedProvider && ['ready','scheduled','in_progress'].includes(selected.status) && <Button size="sm" variant="outline" onClick={() => { setActionMode('blocked'); setActionText('') }}>ثبت مانع</Button>}
                  {isAssignedProvider && ['in_progress','rework'].includes(selected.status) && <Button size="sm" isLoading={busy} onClick={() => { setActionMode('submitted'); setActionText('') }}>ارسال برای تأیید</Button>}
                  {isCustomer && selected.status === 'submitted' && <><Button size="sm" variant="success" isLoading={busy} onClick={() => transition('accepted')}>تأیید انجام کار</Button><Button size="sm" variant="outline" onClick={() => { setActionMode('rework'); setActionText('') }}>درخواست اصلاح</Button></>}
                  {canManage && !['accepted','cancelled'].includes(selected.status) && <Button size="sm" variant="ghost" onClick={() => { if (window.confirm('دستورکار لغو شود؟')) transition('cancelled') }}>لغو</Button>}
                </div>
              </div>
              {selected.status === 'blocked' && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><FiAlertCircle className="ml-2 inline" />علت توقف: {selected.blocked_reason}</div>}
              {actionMode && <form onSubmit={submitAction} className="mt-4 space-y-3 rounded-xl border border-secondary-200 p-4 dark:border-secondary-700"><Textarea label={actionMode === 'blocked' ? 'علت توقف' : actionMode === 'submitted' ? 'گزارش تکمیل کار' : 'شرح اصلاح موردنیاز'} rows={3} value={actionText} onChange={(event) => setActionText(event.target.value)} required /><div className="flex gap-2"><Button size="sm" type="submit" isLoading={busy}>ثبت</Button><Button size="sm" variant="ghost" onClick={() => setActionMode('')}>انصراف</Button></div></form>}
              {selected.completion_report && <div className="mt-4 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-900"><p className="mb-1 text-xs font-semibold text-secondary-500">گزارش پایان کار</p><p className="whitespace-pre-line text-sm">{selected.completion_report}</p></div>}
              {selected.acceptance_notes && <p className="mt-3 text-sm text-secondary-600">یادداشت پذیرش: {selected.acceptance_notes}</p>}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-secondary-500"><span><FiClock className="ml-1 inline" />زمان‌بندی: {dateLabel(selected.scheduled_start)} تا {dateLabel(selected.scheduled_end)}</span><span>پذیرش مشتری: {dateLabel(selected.accepted_at)}</span></div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">وظایف</h3><span className="text-xs text-secondary-500">{selected.tasks?.filter((task) => task.status === 'done').length || 0} از {selected.tasks?.length || 0} انجام شد</span></div>
              <div className="space-y-2">
                {(selected.tasks || []).map((task) => <div key={task.id} className="flex flex-col gap-2 rounded-lg border border-secondary-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-secondary-700"><div><p className={`font-medium ${task.status === 'done' ? 'text-secondary-400 line-through' : ''}`}>{task.title}</p>{task.description && <p className="mt-1 text-xs text-secondary-500">{task.description}</p>}</div><select value={task.status} disabled={!canManage || busy} onChange={(event) => updateTask(task, event.target.value)} className="rounded-lg border border-secondary-300 bg-white px-2 py-1.5 text-xs dark:border-secondary-600 dark:bg-secondary-800"><option value="pending">{taskStatusLabels.pending}</option><option value="in_progress">{taskStatusLabels.in_progress}</option><option value="blocked">{taskStatusLabels.blocked}</option><option value="done">{taskStatusLabels.done}</option></select></div>)}
                {(!selected.tasks || selected.tasks.length === 0) && <p className="text-sm text-secondary-500">برای این دستورکار هنوز وظیفه‌ای تعریف نشده است.</p>}
              </div>
              {canManage && <form onSubmit={addTask} className="mt-4 grid gap-3 border-t border-secondary-100 pt-4 dark:border-secondary-700"><Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="عنوان وظیفه" required /><Input value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="توضیح (اختیاری)" /><div><Button size="sm" type="submit" isLoading={busy}><FiPlus className="ml-1" />افزودن وظیفه</Button></div></form>}
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">مدارک و شواهد</h3><span className="text-xs text-secondary-500">{selected.evidence?.length || 0} فایل</span></div>
              <div className="mb-4 flex flex-wrap gap-2">{(selected.evidence || []).map((item) => <a key={item.id} href={item.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-secondary-50 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 dark:bg-secondary-900 dark:text-primary-300"><FiFile />{item.description || 'مشاهده فایل'}</a>)}{(!selected.evidence || selected.evidence.length === 0) && <p className="text-sm text-secondary-500">هنوز مدرکی بارگذاری نشده است.</p>}</div>
              {canManage && <form onSubmit={addEvidence} className="flex flex-col gap-3 sm:flex-row sm:items-center"><input type="file" required onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full text-sm text-secondary-600 file:ml-3 file:rounded-lg file:border-0 file:bg-secondary-100 file:px-3 file:py-2 dark:text-secondary-300 dark:file:bg-secondary-800" /><Button size="sm" type="submit" disabled={!file} isLoading={busy}><FiUpload className="ml-1" />بارگذاری</Button></form>}
            </Card>

            <Card><h3 className="mb-3 font-semibold">تاریخچه</h3><div className="space-y-3">{(selected.logs || []).map((log) => <div key={log.id} className="flex gap-3 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" /><div><p className="font-medium">{log.note || log.event}</p><p className="mt-1 text-xs text-secondary-500">{dateLabel(log.created_at)}</p></div></div>)}{(!selected.logs || selected.logs.length === 0) && <p className="text-sm text-secondary-500">رویدادی ثبت نشده است.</p>}</div></Card>
          </div>
        ) : <Card className="flex min-h-64 items-center justify-center text-center text-secondary-500"><div><FiTool className="mx-auto mb-3 h-10 w-10" /><p>برای مشاهده جزئیات یک دستورکار را انتخاب کنید.</p></div></Card>}
      </div>
    </div>
  )
}
