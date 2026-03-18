'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from '@user-ui/context/websocket-context';
import useUser from '@user-ui/hooks/useUser';
import { useAuthStore } from '@user-ui/store/authStore';
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NonBlockingAuthWrapper>{children}</NonBlockingAuthWrapper>
      <Toaster position="top-center" reverseOrder={false} />
    </QueryClientProvider>
  );
};

const NonBlockingAuthWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoading } = useUser();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!isLoading) {
      setUser(user || null);
    }
  }, [user, isLoading, setUser]);

  return (
    <WebSocketProvider user={user}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-60 z-50"></div>
      )}
    </WebSocketProvider>
  );
};

export default Provider;
