import api from '@lib/axios'

const procurementService = {
  invoices: () => api.get('/api/procurement/invoices/'),
  payments: () => api.get('/api/procurement/payments/'),
  ledgerAccounts: () => api.get('/api/procurement/ledger/accounts/'),
  ledgerJournals: () => api.get('/api/procurement/ledger/journals/'),
  recordPayment: (data) => api.post('/api/procurement/payments/', data),
  verifyPayment: (id) => api.post(`/api/procurement/payments/${id}/verify/`),
}

export default procurementService
