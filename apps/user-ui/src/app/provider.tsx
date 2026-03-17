'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from '@user-ui/context/websocket-context';
import useUser from '@user-ui/hooks/useUser';
import React, { useState } from 'react';
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
      <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
      <Toaster position="top-center" reverseOrder={false} />
    </QueryClientProvider>
  );
};

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoading } = useUser();

  if (isLoading) return null;
  return (
    <>
      {user && <WebSocketProvider user={user}>{children}</WebSocketProvider>}
      {!user && children}
    </>
  );
};

export default Provider;
