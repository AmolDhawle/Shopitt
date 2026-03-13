import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

// fetch admin data
const fetchAdmin = async () => {
  const response = await axiosInstance.get('/api/admin/me');

  if (!response.data?.admin) {
    return null;
  }
  return response.data.admin;
};

const useAdmin = () => {
  const { setLoggedIn } = useAuthStore();

  const {
    data: admin,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['admin'],
    queryFn: fetchAdmin,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // handle success/error manually
  useEffect(() => {
    setLoggedIn(!!admin);
  }, [admin, setLoggedIn]);

  return { admin, isLoading: isPending, isError };
};

export default useAdmin;
