// src/components/profile/PortfolioManager.jsx
import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiImage, FiTrash2, FiCheck, FiClock } from 'react-icons/fi';
import { Spinner } from '@components/ui';
import { useProfileDocuments } from '@hooks/useProfileDocuments';
import toast from 'react-hot-toast';

export default function PortfolioManager() {
  const { portfolio, portfolioLoading, uploadPortfolio, isUploadingPortfolio, deletePortfolio } = useProfileDocuments();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل‌های تصویری مجاز هستند');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حداکثر حجم ۵ مگابایت');
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('لطفاً یک تصویر انتخاب کنید');
      return;
    }
    if (!title.trim()) {
      toast.error('عنوان نمونه کار الزامی است');
      return;
    }

    await uploadPortfolio({ title, description, image: selectedFile });
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این نمونه کار اطمینان دارید؟')) return;
    await deletePortfolio(id);
  };

  // ========== اصلاح: استفاده از verified به جای is_approved ==========
  const getStatusBadge = (item) => {
    if (item.verified) {  // ← اصلاح
      return <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><FiCheck size={12} /> تایید شده</span>;
    }
    return <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><FiClock size={12} /> در انتظار تایید</span>;
  };

  if (portfolioLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // ========== اصلاح: دسترسی به results ==========
  const items = portfolio?.results || portfolio || [];

  return (
    <div className="space-y-6">
      {/* بخش آپلود */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="font-medium text-slate-800 mb-3">➕ آپلود نمونه کار جدید</h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: سیم‌پیچی موتور ۱۰۰ کیلووات"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              توضیحات (اختیاری)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح کوتاه درباره پروژه"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-slate-600 text-sm"
          >
            <FiImage size={18} />
            {selectedFile ? selectedFile.name : 'انتخاب تصویر'}
          </button>
          
          {previewUrl && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
              <img src={previewUrl} alt="پیش‌نمایش" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
              >
                <FiX size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploadingPortfolio || !selectedFile || !title.trim()}
            className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium flex items-center justify-center gap-2"
          >
            {isUploadingPortfolio ? <Spinner size="sm" /> : <FiUpload size={16} />}
            {isUploadingPortfolio ? 'در حال آپلود...' : 'آپلود نمونه کار'}
          </button>
        </div>
      </div>

      {/* لیست نمونه کارها */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FiImage className="mx-auto text-4xl mb-2 opacity-30" />
          <p className="text-sm">هیچ نمونه کاری ثبت نشده است</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
              <div className="aspect-square">
                <img 
                  src={item.image_url || item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute bottom-0 right-0 left-0 p-3 text-white opacity-0 group-hover:opacity-100 transition">
                <p className="text-sm font-bold truncate">{item.title}</p>
                {item.description && <p className="text-xs opacity-80 truncate">{item.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  {getStatusBadge(item)}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg transition"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="absolute top-2 left-2">
                {getStatusBadge(item)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}