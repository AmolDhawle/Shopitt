import { useRouter } from 'next/navigation';
import { useAuthStore } from '@seller-ui/store/authStore';
import { useEffect } from 'react';

const useRequireAuth = () => {
  const router = useRouter();

  const seller = useAuthStore((s) => s.seller);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !seller) {
      router.replace('/login');
    }
  }, [seller, isLoading]);

  return { seller, isLoading };
};

export default useRequireAuth;
