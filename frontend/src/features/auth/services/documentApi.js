// src/features/auth/services/documentApi.js
import api from '@lib/axios';

export const documentApi = {
  // ==================== Portfolio (نمونه کارها) ====================

  /** دریافت لیست نمونه کارهای کاربر */
  getPortfolio: async () => {
    const response = await api.get('/api/portfolio/');  // ← اصلاح مسیر
    return response.data;
  },

  /** آپلود نمونه کار جدید */
  uploadPortfolio: async (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('image', data.image);

    const response = await api.post('/api/portfolio/', formData, {  // ← اصلاح مسیر
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** حذف نمونه کار */
  deletePortfolio: async (id) => {
    const response = await api.delete(`/api/portfolio/${id}/`);  // ← اصلاح مسیر
    return response.data;
  },

  // ==================== Certificates (مدارک) ====================

  /** دریافت لیست مدارک کاربر */
  getCertificates: async () => {
    const response = await api.get('/api/certifications/');  // ← اصلاح مسیر
    return response.data;
  },

  /** آپلود مدرک جدید */
  uploadCertificate: async (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('file', data.file);

    const response = await api.post('/api/certifications/', formData, {  // ← اصلاح مسیر
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** حذف مدرک */
  deleteCertificate: async (id) => {
    const response = await api.delete(`/api/certifications/${id}/`);  // ← اصلاح مسیر
    return response.data;
  },

  // ==================== Admin (برای ادمین) ====================

  /** دریافت تمام مدارک (ادمین) */
  getAllCertificates: async () => {
    const response = await api.get('/api/admin/certifications/');
    return response.data;
  },

  /** دریافت تمام نمونه کارها (ادمین) */
  getAllPortfolio: async () => {
    const response = await api.get('/api/admin/portfolio/');
    return response.data;
  },
};