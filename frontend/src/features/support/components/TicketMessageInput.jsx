// src/features/support/components/TicketMessageInput.jsx
import { useState, useRef } from 'react'
import { FiSend, FiPaperclip } from 'react-icons/fi'
import { Button, Textarea } from '@components/ui'
import { cn } from '@lib/utils'

export const TicketMessageInput = ({
  onSend,
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim() && !attachment) return

    const formData = new FormData()
    formData.append('body', message)
    if (attachment) {
      formData.append('attachment', attachment)
    }

    onSend(formData)
    setMessage('')
    setAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachment(file)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'این تیکت بسته شده است' : 'پیام خود را بنویسید...'}
          rows={2}
          disabled={disabled || isLoading}
          className="flex-1 resize-none"
        />

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <FiPaperclip className="h-5 w-5" />
            <span className="sr-only">پیوست</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={(!message.trim() && !attachment) || disabled || isLoading}
            isLoading={isLoading}
          >
            <FiSend className="h-4 w-4" />
            <span className="sr-only">ارسال</span>
          </Button>
        </div>
      </div>

      {attachment && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
          <FiPaperclip className="h-4 w-4" />
          <span>{attachment.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setAttachment(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </Button>
        </div>
      )}
    </form>
  )
}