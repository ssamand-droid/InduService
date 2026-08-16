import { useState } from 'react'
import { FiCheck, FiPlay, FiEdit2, FiClock, FiUser } from 'react-icons/fi'
import { Card, Badge, Button, Modal, Spinner } from '@components/ui'
import { FormInput, FormTextarea } from '@components/forms'
import { formatDate } from '@lib/utils'
import { cn } from '@lib/utils'

const stepTypeLabels = {
  inspection: 'بازرسی اولیه',
  diagnosis: 'عیب‌یابی',
  disassembly: 'باز کردن قطعات',
  repair: 'تعمیر',
  replacement: 'تعویض قطعات',
  reassembly: 'مونتاژ مجدد',
  testing: 'تست و راه‌اندازی',
  delivery: 'تحویل نهایی',
}

const stepStatusLabels = {
  pending: 'در انتظار',
  in_progress: 'در حال انجام',
  completed: 'تکمیل شده',
  skipped: 'رد شده',
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  skipped: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export const MROWorkflowSteps = ({
  steps = [],
  isSeller = false,
  isBuyer = false,
  onUpdateStep,
  onAddStep,
  isLoading = false,
}) => {
  const [editingStep, setEditingStep] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleStatusChange = (step, newStatus) => {
    onUpdateStep?.(step.id, { status: newStatus })
  }

  const handleSaveNote = () => {
    if (editingStep) {
      onUpdateStep?.(editingStep.id, { notes: noteText })
      setEditingStep(null)
      setNoteText('')
    }
  }

  const openEditNote = (step) => {
    setEditingStep(step)
    setNoteText(step.notes || '')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
          مراحل اجرایی MRO
        </h3>
        {isSeller && (
          <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
            افزودن مرحله
          </Button>
        )}
      </div>

      {steps.length === 0 ? (
        <p className="text-secondary-500 text-center py-8">
          هنوز مرحله‌ای برای این سفارش ثبت نشده است.
        </p>
      ) : (
        <div className="space-y-3">
          {steps.sort((a, b) => a.order_index - b.order_index).map((step) => (
            <Card key={step.id} className={cn('relative', isLoading && 'opacity-50 pointer-events-none')}>
              <div className="flex items-start gap-4">
                {/* شماره مرحله */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-medium">
                  {step.order_index}
                </div>

                {/* اطلاعات مرحله */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-secondary-900 dark:text-white">
                      {step.title || stepTypeLabels[step.step_type]}
                    </h4>
                    <Badge className={statusColors[step.status]}>
                      {stepStatusLabels[step.status]}
                    </Badge>
                    {step.assigned_to && (
                      <span className="text-xs text-secondary-500 flex items-center gap-1">
                        <FiUser className="h-3 w-3" />
                        {step.assigned_to_name}
                      </span>
                    )}
                  </div>

                  {step.description && (
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                      {step.description}
                    </p>
                  )}

                  {step.notes && (
                    <div className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg text-sm">
                      <span className="font-medium">یادداشت فنی:</span> {step.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-secondary-500">
                    {step.started_at && (
                      <span className="flex items-center gap-1">
                        <FiClock className="h-3 w-3" />
                        شروع: {formatDate(step.started_at)}
                      </span>
                    )}
                    {step.completed_at && (
                      <span className="flex items-center gap-1">
                        <FiCheck className="h-3 w-3 text-green-500" />
                        پایان: {formatDate(step.completed_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* عملیات */}
                {isSeller && (
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {step.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(step, 'in_progress')}
                        title="شروع مرحله"
                      >
                        <FiPlay className="h-4 w-4" />
                      </Button>
                    )}
                    {step.status === 'in_progress' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(step, 'completed')}
                        title="تکمیل مرحله"
                        className="text-green-600"
                      >
                        <FiCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditNote(step)}
                      title="افزودن یادداشت"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal ویرایش یادداشت */}
      <Modal
        isOpen={!!editingStep}
        onClose={() => setEditingStep(null)}
        title="یادداشت فنی"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingStep(null)}>
              انصراف
            </Button>
            <Button variant="primary" onClick={handleSaveNote}>
              ذخیره
            </Button>
          </>
        }
      >
        <FormTextarea
          label="یادداشت"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
          placeholder="توضیحات فنی خود را وارد کنید..."
        />
      </Modal>

      {/* Modal افزودن مرحله جدید */}
      <AddStepModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(data) => {
          onAddStep?.(data)
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}

// کامپوننت Modal افزودن مرحله
const AddStepModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    step_type: 'inspection',
    title: '',
    description: '',
    order_index: 1,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="افزودن مرحله جدید">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">نوع مرحله</label>
          <select
            value={formData.step_type}
            onChange={(e) => setFormData({ ...formData, step_type: e.target.value })}
            className="w-full rounded-lg border border-secondary-300 p-2"
          >
            {Object.entries(stepTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <FormInput
          label="عنوان مرحله"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <FormTextarea
          label="توضیحات"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
        <FormInput
          label="ترتیب"
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="submit" variant="primary">افزودن</Button>
        </div>
      </form>
    </Modal>
  )
}