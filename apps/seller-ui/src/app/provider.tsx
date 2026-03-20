'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from '@seller-ui/context/websocket-context';
import useSeller from '@seller-ui/hooks/useSeller';
import { useAuthStore } from '@seller-ui/store/authStore';
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
  const { seller, isLoading } = useSeller();
  const setSeller = useAuthStore((s) => s.setSeller);

  useEffect(() => {
    if (!isLoading) {
      setSeller(seller || null);
    }
  }, [seller, isLoading, setSeller]);

  return (
    <WebSocketProvider seller={seller}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-60 z-50"></div>
      )}
    </WebSocketProvider>
  );
};

export default Provider;
