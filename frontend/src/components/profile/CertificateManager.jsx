// src/components/profile/CertificateManager.jsx
import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiFile, FiTrash2, FiCheck, FiClock, FiDownload } from 'react-icons/fi';
import { Spinner } from '@components/ui';
import { useProfileDocuments } from '@hooks/useProfileDocuments';
import toast from 'react-hot-toast';

const ALLOWED_FILE_TYPES = ['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function CertificateManager() {
  const { certificates, certificatesLoading, uploadCertificate, isUploadingCertificate, deleteCertificate } = useProfileDocuments();
  const [title, setTitle] = useState('');
  const [issuedBy, setIssuedBy] = useState('');  // ← اضافه شد
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
    if (!allowedExts.includes(ext)) {
      toast.error('فرمت فایل مجاز نیست. فرمت‌های مجاز: تصاویر، PDF، Word، Excel');
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error('حداکثر حجم ۱۰ مگابایت');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('لطفاً یک فایل انتخاب کنید');
      return;
    }
    if (!title.trim()) {
      toast.error('عنوان مدرک الزامی است');
      return;
    }

    await uploadCertificate({ 
      title, 
      file: selectedFile,
      issued_by: issuedBy  // ← اضافه شد
    });
    setTitle('');
    setIssuedBy('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این مدرک اطمینان دارید؟')) return;
    await deleteCertificate(id);
  };

  // ========== اصلاح: استفاده از verified به جای is_approved ==========
  const getStatusBadge = (item) => {
    if (item.verified) {  // ← اصلاح
      return <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><FiCheck size={12} /> تایید شده</span>;
    }
    return <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><FiClock size={12} /> در انتظار تایید</span>;
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop().toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    return '📎';
  };

  if (certificatesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // ========== اصلاح: دسترسی به results ==========
  const items = certificates?.results || certificates || [];

  return (
    <div className="space-y-6">
      {/* بخش آپلود */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="font-medium text-slate-800 mb-3">📤 آپلود مدرک جدید</h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              عنوان مدرک <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: گواهینامه تعمیرات PLC"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              صادرکننده (اختیاری)
            </label>
            <input
              type="text"
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
              placeholder="مثال: سازمان فنی و حرفه‌ای"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            فایل <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-slate-600 text-sm flex-1"
            >
              <FiFile size={18} />
              {selectedFile ? selectedFile.name : 'انتخاب فایل'}
            </button>
            {selectedFile && (
              <button
                type="button"
                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            فرمت‌های مجاز: تصاویر، PDF، Word، Excel • حداکثر ۱۰ مگابایت
          </p>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploadingCertificate || !selectedFile || !title.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium flex items-center justify-center gap-2"
          >
            {isUploadingCertificate ? <Spinner size="sm" /> : <FiUpload size={16} />}
            {isUploadingCertificate ? 'در حال آپلود...' : 'آپلود مدرک'}
          </button>
        </div>
      </div>

      {/* لیست مدارک */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FiFile className="mx-auto text-4xl mb-2 opacity-30" />
          <p className="text-sm">هیچ مدرکی ثبت نشده است</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{getFileIcon(item.file_url || item.file)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{item.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    {item.issued_by && <span>صادرکننده: {item.issued_by}</span>}
                    <span>{new Date(item.created_at).toLocaleDateString('fa-IR')}</span>
                    {getStatusBadge(item)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={item.file_url || item.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <FiDownload size={18} />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}