import api from '@lib/axios'
import { buildQueryString } from '@lib/utils'

export const productApi = {
  // دریافت لیست محصولات با فیلتر
  getProducts: async (filters = {}) => {
    const queryString = buildQueryString(filters)
    const response = await api.get(`/api/products/products/${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  // دریافت جزئیات یک محصول
  getProduct: async (slug) => {
    const response = await api.get(`/api/products/products/${slug}/`)
    return response.data
  },

  // دریافت محصولات فروشنده (برای داشبورد)
  getMyProducts: async () => {
    const response = await api.get('/api/products/products/my_products/')
    return response.data
  },

  // ایجاد محصول جدید
  createProduct: async (productData) => {
    const response = await api.post('/api/products/products/', productData)
    return response.data
  },

  // بروزرسانی محصول
  updateProduct: async (slug, productData) => {
    const response = await api.patch(`/api/products/products/${slug}/`, productData)
    return response.data
  },

  // حذف محصول
  deleteProduct: async (slug) => {
    const response = await api.delete(`/api/products/products/${slug}/`)
    return response.data
  },

  // دریافت دسته‌بندی‌ها
  getCategories: async () => {
    const response = await api.get('/api/products/categories/')
    return response.data
  },

  // دریافت برندها
  getBrands: async () => {
    const response = await api.get('/api/products/brands/')
    return response.data
  },
}