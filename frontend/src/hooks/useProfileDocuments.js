// src/hooks/useProfileDocuments.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { documentApi } from '@features/auth/services/documentApi';

export const useProfileDocuments = () => {
  const queryClient = useQueryClient();

  // ==================== Portfolio ====================

  const { data: portfolio, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: documentApi.getPortfolio,
  });

  const uploadPortfolioMutation = useMutation({
    mutationFn: documentApi.uploadPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('نمونه کار با موفقیت آپلود شد');
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || error.response?.data?.message || 'خطا در آپلود نمونه کار';
      toast.error(msg);
    },
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: documentApi.deletePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('نمونه کار حذف شد');
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || error.response?.data?.message || 'خطا در حذف نمونه کار';
      toast.error(msg);
    },
  });

  // ==================== Certificates ====================

  const { data: certificates, isLoading: certificatesLoading, refetch: refetchCertificates } = useQuery({
    queryKey: ['certificates'],
    queryFn: documentApi.getCertificates,
  });

  const uploadCertificateMutation = useMutation({
    mutationFn: documentApi.uploadCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('مدرک با موفقیت آپلود شد');
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || error.response?.data?.message || 'خطا در آپلود مدرک';
      toast.error(msg);
    },
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: documentApi.deleteCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('مدرک حذف شد');
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || error.response?.data?.message || 'خطا در حذف مدرک';
      toast.error(msg);
    },
  });

  return {
    // Portfolio
    portfolio: portfolio,
    portfolioLoading,
    refetchPortfolio,
    uploadPortfolio: uploadPortfolioMutation.mutate,
    isUploadingPortfolio: uploadPortfolioMutation.isPending,
    deletePortfolio: deletePortfolioMutation.mutate,
    isDeletingPortfolio: deletePortfolioMutation.isPending,

    // Certificates
    certificates: certificates,
    certificatesLoading,
    refetchCertificates,
    uploadCertificate: uploadCertificateMutation.mutate,
    isUploadingCertificate: uploadCertificateMutation.isPending,
    deleteCertificate: deleteCertificateMutation.mutate,
    isDeletingCertificate: deleteCertificateMutation.isPending,
  };
};