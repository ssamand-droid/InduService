// src/features/payment/services/paymentApi.js
import api from '@lib/axios'

export const paymentApi = {
  // فاکتورها
  getInvoices: async () => {
    const response = await api.get('/api/payment/invoices/')
    return response.data
  },

  getInvoice: async (id) => {
    const response = await api.get(`/api/payment/invoices/${id}/`)
    return response.data
  },

  // کیف پول
  getMyWallet: async () => {
    const response = await api.get('/api/payment/wallets/my_wallet/')
    return response.data
  },

  getTransactions: async () => {
    const response = await api.get('/api/payment/wallets/transactions/')
    return response.data
  },
}