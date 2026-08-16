import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../services/productApi'
import toast from 'react-hot-toast'

export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getProducts(filters),
    keepPreviousData: true,
  })
}

export const useProduct = (slug, options = {}) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getProduct(slug),
    enabled: !!slug && options?.enabled !== false,
  })
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: productApi.getCategories,
  })
}

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: productApi.getBrands,
  })
}

export const useMyProducts = () => {
  return useQuery({
    queryKey: ['my-products'],
    queryFn: productApi.getMyProducts,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('محصول با موفقیت ایجاد شد')
    },
    onError: (error) => {
      toast.error(error.userMessage || 'خطا در ایجاد محصول')
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slug, data }) => productApi.updateProduct(slug, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.slug] })
      toast.success('محصول با موفقیت بروزرسانی شد')
    },
    onError: (error) => {
      toast.error(error.userMessage || 'خطا در بروزرسانی محصول')
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      toast.success('محصول با موفقیت حذف شد')
    },
    onError: (error) => {
      toast.error(error.userMessage || 'خطا در حذف محصول')
    },
  })
}