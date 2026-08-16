import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi'
import { useMyProducts, useDeleteProduct } from '@features/products/hooks/useProducts'
import { Spinner, Alert, Button, Card, ConfirmModal, Badge } from '@components/ui'
import { formatPrice } from '@lib/utils'

export default function MyProducts() {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null })
  const { data, isLoading, error } = useMyProducts()
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()

  const products = data?.results || []

  const handleDelete = () => {
    if (deleteModal.product) {
      deleteProduct(deleteModal.product.slug, {
        onSuccess: () => setDeleteModal({ isOpen: false, product: null })
      })
    }
  }

  if (isLoading) return <div className="p-6"><Spinner size="lg" /></div>
  if (error) return <Alert variant="error">خطا در دریافت محصولات</Alert>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2">محصولات من</h1>
        <Link to="/dashboard/products/new">
          <Button variant="primary"><FiPlus className="ml-2" />محصول جدید</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-secondary-500 mb-4">شما هنوز محصولی ثبت نکرده‌اید.</p>
          <Link to="/dashboard/products/new">
            <Button variant="primary">ثبت اولین محصول</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right text-sm font-medium text-secondary-500">
                  <th className="pb-3">نام محصول</th>
                  <th className="pb-3">کد انبار</th>
                  <th className="pb-3">قیمت</th>
                  <th className="pb-3">موجودی</th>
                  <th className="pb-3">وضعیت</th>
                  <th className="pb-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="text-sm">
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3 text-secondary-600">{product.sku}</td>
                    <td className="py-3 text-primary-600">{formatPrice(product.final_price)}</td>
                    <td className="py-3">{product.stock_quantity}</td>
                    <td className="py-3">
                      <Badge variant={product.is_active ? 'success' : 'secondary'}>
                        {product.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/products/${product.slug}`}><Button variant="ghost" size="sm"><FiEye /></Button></Link>
                        <Link to={`/dashboard/products/${product.slug}/edit`}><Button variant="ghost" size="sm"><FiEdit2 /></Button></Link>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteModal({ isOpen: true, product })}><FiTrash2 /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleDelete}
        title="حذف محصول"
        message={`آیا از حذف "${deleteModal.product?.name}" اطمینان دارید؟`}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}