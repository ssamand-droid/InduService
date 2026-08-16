// src/features/wizard/ProviderQuoteModal.jsx
import React from 'react'
import { X } from 'lucide-react'
import ProviderWizard from './ProviderWizard'

export default function ProviderQuoteModal({ isOpen, request, onClose, onSuccess }) {
  if (!isOpen || !request) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-bold text-slate-800 text-sm">ارائه پیشنهاد</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500">
            <X size={18} />
          </button>
        </div>
        <ProviderWizard request={request} onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  )
}
