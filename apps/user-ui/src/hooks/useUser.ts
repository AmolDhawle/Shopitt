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
  const { setUser } = useAuthStore();

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

  useEffect(() => {
    if (user) {
      setUser(user);
    } else if (isError) {
      setUser(null);
    }
  }, [user, isError, setUser]);

  return { user, isLoading: isPending, isError };
};
export default useUser;
