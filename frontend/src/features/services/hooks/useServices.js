import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceApi } from '../services/serviceApi'
import toast from 'react-hot-toast'

export const useServices = (filters = {}) => {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: () => serviceApi.getServices(filters),
    keepPreviousData: true,
    staleTime: 60000, // 1 دقیقه
    retry: 1,
  })
}

export const useService = (slug) => {
  return useQuery({
    queryKey: ['service', slug],
    queryFn: () => serviceApi.getService(slug),
    enabled: !!slug,
    staleTime: 60000,
    retry: 1,
  })
}

export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: () => serviceApi.getServiceCategories(),
    staleTime: 300000, // 5 دقیقه
    retry: 1,
  })
}

export const useMyOrganizations = () => useQuery({
  queryKey: ['my-organizations'],
  queryFn: serviceApi.getMyOrganizations,
  staleTime: 60000,
  retry: 1,
})

export const useMyServices = () => {
  return useQuery({
    queryKey: ['my-services'],
    queryFn: () => serviceApi.getMyServices(),
    staleTime: 30000,
    retry: 1,
  })
}

export const useServiceRequests = () => {
  return useQuery({
    queryKey: ['service-requests'],
    queryFn: () => serviceApi.getServiceRequests(),
    retry: 1,
    staleTime: 10000,
    refetchOnMount: true,
  })
}

export const useCreateService = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: serviceApi.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('خدمت ایجاد شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useUpdateService = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, data }) => serviceApi.updateService(slug, data),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] })
      queryClient.invalidateQueries({ queryKey: ['service', slug] })
      toast.success('خدمت بروزرسانی شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useDeleteService = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: serviceApi.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('خدمت حذف شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: serviceApi.createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('درخواست ثبت شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useAcceptQuote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => serviceApi.acceptQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('قیمت پذیرفته شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useStartWork = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: serviceApi.startWork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('کار شروع شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useCompleteService = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: serviceApi.completeService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('خدمت تکمیل شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useProviderQuote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => serviceApi.providerQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('قیمت با موفقیت اعلام شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useForceMajeure = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => serviceApi.forceMajeure(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('فورس ماژور ثبت شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useCompleteWithImages = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }) => serviceApi.completeWithImages(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('خدمت تکمیل شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}

export const useSubmitReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => serviceApi.submitReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('امتیاز ثبت شد')
    },
    onError: (error) => toast.error(error.userMessage || 'خطا'),
  })
}
