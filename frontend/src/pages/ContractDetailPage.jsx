import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiCheck, FiFileText, FiTruck } from 'react-icons/fi'
import { contractApi } from '@features/contracts/services/contractApi'
import { useAuthStore } from '@stores/authStore'
import { Card, Button, Badge, Spinner, Alert } from '@components/ui'
import { formatPrice, formatDate } from '@lib/utils'

export default function ContractDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractApi.getContract(id),
  })

  const handleSign = async () => {
    try {
      await contractApi.signContract(id)
      // refetch
    } catch (error) {
      alert(error.message)
    }
  }

  if (isLoading) return <Spinner />
  if (!contract) return <Alert variant="error">قرارداد یافت نشد</Alert>

  const canSign = (user.id === contract.buyer && !contract.buyer_signed) ||
                  (user.id === contract.seller && !contract.seller_signed)

  return (
    <div className="container-custom py-8">
      <div className="flex items-center gap-3 mb-6">
        <FiFileText className="h-8 w-8 text-primary-600" />
        <h1 className="heading-2">قرارداد {contract.contract_number}</h1>
        <Badge variant={contract.status === 'active' ? 'success' : 'warning'}>
          {contract.status_display}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-bold mb-4">{contract.title}</h3>
            <p className="text-secondary-600 mb-4">{contract.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-secondary-500">نوع قرارداد:</span> {contract.contract_type_display}</div>
              <div><span className="text-secondary-500">ارزش:</span> {formatPrice(contract.contract_value)}</div>
              <div><span className="text-secondary-500">تاریخ شروع:</span> {contract.start_date}</div>
              <div><span className="text-secondary-500">اتمام پیش‌بینی:</span> {contract.expected_completion_date}</div>
            </div>
          </Card>

          {/* Milestones */}
          {contract.milestones?.length > 0 && (
            <Card>
              <h3 className="font-bold mb-4">مراحل پرداخت/تحویل</h3>
              <div className="space-y-3">
                {contract.milestones.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded">
                    <div className="flex items-center gap-2">
                      {m.is_completed && <FiCheck className="text-green-500" />}
                      <span>{m.title}</span>
                    </div>
                    <span>{formatPrice(m.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-bold mb-4">وضعیت امضا</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>امضای خریدار:</span>
                <Badge variant={contract.buyer_signed ? 'success' : 'warning'}>
                  {contract.buyer_signed ? 'امضا شده' : 'در انتظار'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>امضای فروشنده:</span>
                <Badge variant={contract.seller_signed ? 'success' : 'warning'}>
                  {contract.seller_signed ? 'امضا شده' : 'در انتظار'}
                </Badge>
              </div>
            </div>
            {canSign && (
              <Button onClick={handleSign} className="mt-4 w-full">
                امضای دیجیتال قرارداد
              </Button>
            )}
          </Card>

          {/* Equipment Transfer (اگر وجود دارد) */}
          {contract.equipment_transfers?.length > 0 && (
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FiTruck /> وضعیت انتقال تجهیز
              </h3>
              {contract.equipment_transfers.map(transfer => (
                <div key={transfer.id}>
                  <p className="font-medium">{transfer.equipment_name}</p>
                  <Badge>{transfer.status_display}</Badge>
                  {transfer.outbound_tracking_code && (
                    <p className="text-sm mt-2">کد رهگیری: {transfer.outbound_tracking_code}</p>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}