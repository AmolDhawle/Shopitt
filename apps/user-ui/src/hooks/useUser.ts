import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

// fetch user data
const fetchUser = async () => {
  const response = await axiosInstance.get('/api/me');
  return response.data.user;
};

const useUser = () => {
  const { setLoggedIn } = useAuthStore();

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // handle success/error manually
  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    }
    if (isError) {
      setLoggedIn(false);
    }
  }, [user, isError, setLoggedIn]);

  return { user, isLoading: isPending, isError };
};

export default useUser;
