'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';

const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  seller,
}: {
  children: React.ReactNode;
  seller: any;
}) => {
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!seller?.id) return;

    const ws = new WebSocket(process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI!);
    wsRef.current = ws;
    setWsInstance(ws);

    ws.onopen = () => {
      ws.send(`seller_${seller.id}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UNSEEN_COUNT_UPDATE') {
          const { conversationId, count } = data.payload;
          setUnreadCounts((prev) => ({ ...prev, [conversationId]: count }));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [seller?.id]);

  const value = useMemo(
    () => ({
      ws: wsInstance,
      unreadCounts,
    }),
    [unreadCounts, wsInstance],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
