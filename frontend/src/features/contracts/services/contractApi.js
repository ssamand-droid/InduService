import api from '@lib/axios'

export const contractApi = {
  getContracts: () => api.get('/api/contracts/contracts/').then(res => res.data),
  getContract: (id) => api.get(`/api/contracts/contracts/${id}/`).then(res => res.data),
  signContract: (id) => api.post(`/api/contracts/contracts/${id}/sign/`).then(res => res.data),

  getTransfers: () => api.get('/api/contracts/transfers/').then(res => res.data),
  updateTransferStatus: (id, status) =>
    api.post(`/api/contracts/transfers/${id}/update_status/`, { status }).then(res => res.data),
}