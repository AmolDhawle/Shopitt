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
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const ws = new WebSocket(process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI!);
    setWsInstance(ws);

    ws.onopen = () => {
      ws.send(`user_${user.id}`);
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
  }, [user?.id]);

  const value = useMemo(
    () => ({
      ws: wsInstance,
      unreadCounts,
    }),
    [unreadCounts],
  );

  return (
    <WebSocketContext.Provider value={{ ws: wsInstance, unreadCounts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
