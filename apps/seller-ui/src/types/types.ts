export type ID = string;

export type SenderType = 'user' | 'seller';

export interface Message {
  id?: ID;
  conversationId: ID;
  senderId: ID;
  senderType: SenderType;
  content: string;
  attachments?: string[];
  status?: 'sent' | 'delivered' | 'seen';
  createdAt: string;
  seen?: boolean;
}

// ==============================
// USER / SELLER
// ==============================

export interface ChatUser {
  id: ID | null;
  name: string;
  avatar: string | null;
  isOnline: boolean;
}

export interface ChatSeller {
  id: ID | null;
  name: string;
  avatar: string | null;
  isOnline: boolean;
}

// ==============================
// CONVERSATIONS
// ==============================

// Seller side
export interface SellerConversation {
  conversationId: ID;
  user: ChatUser;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// User side
export interface UserConversation {
  conversationId: ID;
  seller: ChatSeller;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// Generic Chat
export type Chat = SellerConversation;

// ==============================
// API RESPONSES
// ==============================

export interface GetSellerConversationsResponse {
  conversations: SellerConversation[];
}

export interface GetUserConversationsResponse {
  conversations: UserConversation[];
}

export interface GetMessagesResponse {
  messages: Message[];
  currentPage: number;
  hasMore: boolean;
}

// seller version
export interface GetSellerMessagesResponse extends GetMessagesResponse {
  user: ChatUser | null;
}

// user version
export interface GetUserMessagesResponse extends GetMessagesResponse {
  seller: ChatSeller | null;
}

// ==============================
// WEBSOCKET TYPES
// ==============================

export interface NewMessagePayload {
  conversationId: ID;
  senderId: ID;
  senderType: SenderType;
  content: string;
  createdAt: string;
}

export interface UnseenCountPayload {
  conversationId: ID;
  count: number;
}

export type WebSocketIncomingMessage =
  | {
      type: 'NEW_MESSAGE';
      payload: NewMessagePayload;
    }
  | {
      type: 'UNSEEN_COUNT_UPDATE';
      payload: UnseenCountPayload;
    };

// outgoing WS message (from frontend)
export interface SendMessagePayload {
  fromUserId: ID | undefined;
  toUserId: ID | null | undefined;
  conversationId: ID;
  messageBody: string;
  senderType: SenderType;
}

export interface MarkAsSeenPayload {
  type: 'MARK_AS_SEEN';
  conversationId: ID;
}

// ==============================
// REACT QUERY HELPERS
// ==============================

export type MessagesQueryKey = ['messages', string | null];
export type ConversationsQueryKey = ['conversations'];
