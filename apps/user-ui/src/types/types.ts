export type User = {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
};

export type Seller = {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
};

export type Message = {
  content: string;
  senderType: 'user' | 'seller';
  createdAt: string;
  time?: string; // Optional, used for custom time rendering
  conversationId: string;
  seen: boolean;
};

export type Chat = {
  conversationId: string;
  seller: Seller;
  lastMessage: string;
  unreadCount: number;
};

export type WebSocketPayload = {
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  messageBody: string;
  senderType: 'user' | 'seller';
};

export type WebSocketIncomingMessage = {
  type: 'NEW_MESSAGE' | 'UNSEEN_COUNT_UPDATE';
  payload: {
    conversationId: string;
    count?: number;
    content?: string;
    senderType: 'user' | 'seller';
    senderId: string;
    createdAt: string;
  };
};

export type WebSocketConnection = WebSocket;
