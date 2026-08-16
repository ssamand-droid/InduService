import api from '@lib/axios'

const assetService = {
  // ============ داشبورد ============
  getGlobalDashboard: () => api.get('/api/assets/assets/global_dashboard/'),

  // ============ دارایی‌ها ============
  getAssets: (params) => api.get('/api/assets/all/', { params }),
  getAsset: (id) => api.get(`/api/assets/all/${id}/`),
  createAsset: (data) => {
    // اگر FormData باشه، هدر multipart بفرسته
    if (data instanceof FormData) {
      return api.post('/api/assets/all/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    // وگرنه JSON بفرسته
    return api.post('/api/assets/all/', data)
  },
  updateAsset: (id, data) => api.patch(`/api/assets/all/${id}/`, data),
  deleteAsset: (id) => api.delete(`/api/assets/all/${id}/`),

  // ============ عملیات دارایی ============
  getAssetDashboard: (id) => api.get(`/api/assets/assets/${id}/dashboard/`),
  updateHealth: (id, data) => api.post(`/api/assets/assets/${id}/update_health/`, data),
  emergencyStop: (id) => api.post(`/api/assets/assets/${id}/emergency_stop/`),

  // ============ قطعات ============
  getParts: (assetId) => api.get(`/api/assets/assets/${assetId}/parts/`),
  addPart: (assetId, data) => api.post(`/api/assets/assets/${assetId}/parts/`, data),

  // ============ اسناد ============
  getDocuments: (assetId) => api.get(`/api/assets/assets/${assetId}/documents/`),
  uploadDocument: (assetId, formData) => api.post(`/api/assets/assets/${assetId}/documents/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // ============ تعمیرات ============
  getMaintenanceLogs: (assetId) => api.get(`/api/assets/assets/${assetId}/maintenance/`),
  addMaintenanceLog: (assetId, data) => api.post(`/api/assets/assets/${assetId}/maintenance/`, data),

  // ============ هشدارها ============
  getAlerts: () => api.get('/api/assets/alerts/'),
  markAlertRead: (id) => api.post(`/api/assets/alerts/${id}/mark_read/`),

  // ============ واردات ============
  downloadTemplate: () => api.get('/api/assets/assets/download_template/', {
    responseType: 'blob'
  }),
  bulkImport: (formData) => api.post('/api/assets/assets/bulk_import_excel/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // ============ دسته‌بندی‌ها ============
  getCategories: () => api.get('/api/assets/categories/'),

  // ============ د ============ سنسورها
  getSensors: (assetId) => api.get(`/api/assets/assets/${assetId}/sensors/`),
  addSensor: (assetId, data) => api.post(`/api/assets/assets/${assetId}/sensors/`, data),
  getSensorReadings: (assetId, sensorId, hours = 24) => api.get(`/api/assets/assets/${assetId}/sensors/${sensorId}/readings/?hours=${hours}`),
  recordReading: (assetId, sensorId, data) => api.post(`/api/assets/assets/${assetId}/sensors/${sensorId}/record_reading/`, data),

  // ============ د ============ پیش‌بینی
  runPrediction: (assetId) => api.post(`/api/assets/assets/${assetId}/run_prediction/`),
  getPredictions: (assetId) => api.get(`/api/assets/assets/${assetId}/predictions/`), 
}

export default assetService