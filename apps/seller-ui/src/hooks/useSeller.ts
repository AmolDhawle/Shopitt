import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';
import { useAuthStore } from '@seller-ui/store/authStore';
import { useEffect } from 'react';

// fetch user data from API
const fetchSeller = async () => {
  const response = await axiosInstance.get('/api/seller/me');
  if (!response.data?.seller) {
    throw new Error('Seller data missing');
  }

  return response.data.seller;
};

const useSeller = () => {
  const { setSeller } = useAuthStore();
  const {
    data: seller,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['seller'],
    queryFn: fetchSeller,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  useEffect(() => {
    if (seller) {
      setSeller(seller);
    } else if (isError) {
      setSeller(null);
    }
  }, [seller, isError, setSeller]);

  return { seller, isLoading, isError, refetch };
};

export default useSeller;
