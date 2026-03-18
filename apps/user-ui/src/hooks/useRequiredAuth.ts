import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@user-ui/store/authStore';

const useRequireAuth = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading]);

  return { user, isLoading };
};

export default useRequireAuth;
