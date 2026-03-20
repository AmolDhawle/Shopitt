'use client';

import { useWebSocket } from '@seller-ui/context/websocket-context';
import ChatInput from '@seller-ui/shared/components/chats/chatInput';
import { useAuthStore } from '@seller-ui/store/authStore';
import {
  GetSellerConversationsResponse,
  GetSellerMessagesResponse,
  Message,
  SellerConversation,
  SendMessagePayload,
  WebSocketIncomingMessage,
} from '@seller-ui/types/types';
import axiosInstance from '@seller-ui/utils/axiosInstance';
import { isProtected } from '@seller-ui/utils/protected';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

const ChatPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const seller = useAuthStore((s) => s.seller);
  const queryClient = useQueryClient();
  const conversationId = searchParams.get('conversationId');
  const { ws, unreadCounts } = useWebSocket();

  const [chats, setChats] = useState<SellerConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<SellerConversation | null>(
    null,
  );
  const [message, setMessage] = useState('');
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const { data: conversations, isLoading } =
    useQuery<GetSellerConversationsResponse>({
      queryKey: ['conversations'],
      queryFn: async () => {
        const res = await axiosInstance.get<GetSellerConversationsResponse>(
          '/chatting/api/get-seller-conversations',
          isProtected,
        );
        return res.data;
      },
    });

  const { data } = useQuery<GetSellerMessagesResponse>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) {
        return {
          messages: [],
          currentPage: 0,
          hasMore: false,
          user: null,
        };
      }

      const res = await axiosInstance.get<GetSellerMessagesResponse>(
        `/chatting/api/get-seller-messages/${conversationId}?page=1`,
        isProtected,
      );

      setPage(1);
      setHasMore(res.data.hasMore);
      setHasFetchedOnce(true);

      return res.data;
    },
    enabled: !!conversationId,
  });

  const messages: Message[] = data?.messages || [];

  const loadMoreMessages = async () => {
    if (!conversationId) return;

    const nextPage = page + 1;
    const res = await axiosInstance.get<GetSellerMessagesResponse>(
      `/chatting/api/get-seller-messages/${conversationId}?page=${nextPage}`,
      isProtected,
    );

    queryClient.setQueryData<GetSellerMessagesResponse>(
      ['messages', conversationId],
      (old) => {
        if (!old) return res.data;

        return {
          ...old,
          messages: [...res.data.messages, ...old.messages],
          currentPage: nextPage,
          hasMore: res.data.hasMore,
        };
      },
    );

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  useEffect(() => {
    if (conversations) setChats(conversations.conversations);
  }, [conversations]);

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
  }, [conversationId, messages.length]);

  useEffect(() => {
    if (conversationId && chats.length > 0) {
      const chat = chats.find((c) => c.conversationId === conversationId);
      setSelectedChat(chat || null);
    }
  }, [conversationId, chats]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
  };

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data: WebSocketIncomingMessage = JSON.parse(event.data);

      if (data.type === 'NEW_MESSAGE') {
        const newMsg: Message = {
          content: data.payload.content || '',
          senderType: data.payload.senderType,
          senderId: data.payload.senderId || '',
          conversationId: data.payload.conversationId,
          createdAt: data.payload.createdAt,
        };

        if (newMsg.conversationId === conversationId) {
          queryClient.setQueryData<GetSellerMessagesResponse>(
            ['messages', conversationId],
            (old) => {
              if (!old)
                return {
                  messages: [newMsg],
                  currentPage: 1,
                  hasMore: false,
                  user: null,
                };

              return {
                ...old,
                messages: [...old.messages, newMsg],
              };
            },
          );

          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.conversationId === newMsg.conversationId
                ? { ...chat, lastMessage: newMsg.content }
                : chat,
            ),
          );

          scrollToBottom();
        }
      }

      if (data.type === 'UNSEEN_COUNT_UPDATE') {
        const { conversationId, count } = data.payload;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.conversationId === conversationId
              ? { ...chat, unreadCount: count ?? 0 }
              : chat,
          ),
        );
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, conversationId, queryClient]);

  const handleChatSelect = (chat: any) => {
    setHasFetchedOnce(false);

    setChats((prev) =>
      prev.map((c) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
    router.push(`?conversationId=${chat.conversationId}`);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'MARK_AS_SEEN',
          conversationId: chat.conversationId,
        }),
      );
    }
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (
      !message.trim() ||
      !selectedChat ||
      !ws ||
      ws.readyState !== WebSocket.OPEN
    )
      return;

    const payload: SendMessagePayload = {
      fromUserId: seller?.id,
      toUserId: selectedChat?.user?.id,
      conversationId: selectedChat.conversationId,
      messageBody: message,
      senderType: 'seller',
    };

    ws?.send(JSON.stringify(payload));

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.conversationId === selectedChat.conversationId
          ? { ...chat, lastMessage: payload.messageBody }
          : chat,
      ),
    );

    setMessage('');
    scrollToBottom();
  };

  return (
    <div className="w-full">
      <div className="flex h-screen shadow-inner overflow-hidden bg-gray-950 text-gray-100">
        {/* Sidebar */}
        <div className="w-[320px] border-r border-gray-200 bg-gray-950">
          <div className="p-4 border-b border-b-gray-200 text-lg font-semibold text-gray-800">
            Messages
          </div>
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No conversations available yet.
              </div>
            ) : (
              chats.map((chat) => {
                const isActive =
                  selectedChat?.conversationId === chat.conversationId;

                return (
                  <button
                    key={chat.conversationId}
                    className={`w-full text-left px-4 py-3 transition hover:bg-blue-50 ${
                      isActive
                        ? 'bg-blue-950 hover:bg-blue-900'
                        : 'hover:bg-gray-900'
                    }`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={
                          chat.user?.avatar ||
                          'https://ik.imagekit.io/5frbx53sr/avatar/seller-avatar.jpeg?updatedAt=1772470525820'
                        }
                        alt={chat.user?.name}
                        width={36}
                        height={36}
                        className="rounded-full border w-[40px] h-[40px] object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-100 font-semibold">
                            {chat.user?.name}
                          </span>
                          {chat.user?.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-200 truncate max-w-[170px]">
                            {chat.lastMessage || ''}{' '}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="ml-2 text-xs bg-blue-500 text-white rounded-full px-2">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 bg-gray-100">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-b-gray-200 bg-white flex items-center gap-3">
                <Image
                  src={
                    selectedChat.user?.avatar ||
                    'https://ik.imagekit.io/5frbx53sr/avatar/user-avatar.svg?updatedAt=1772470525820'
                  }
                  alt={selectedChat.user?.name}
                  width={40}
                  height={40}
                  className="rounded-full border border-gray-200 w-[40px] h-[40px] object-cover"
                />

                <div>
                  <h2 className="text-gray-800 font-semibold text-base">
                    {selectedChat.user?.name}{' '}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedChat.user?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-sm"
              >
                {hasMore && (
                  <div className="flex justify-center mb-2">
                    <button
                      onClick={loadMoreMessages}
                      className="text-xs px-4 py-1 bg-gray-400 hover:bg-gray-500 rounded-full"
                    >
                      Load previous message
                    </button>
                  </div>
                )}

                {messages?.map((msg: any, index: number) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      msg.senderType === 'seller'
                        ? 'items-end ml-auto'
                        : 'items-start'
                    } max-w-[80%]`}
                  >
                    <div
                      className={`${msg.senderType === 'seller' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} px-4 py-2 rounded-lg shadow-sm w-fit`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`text-[11px] text-gray-400 mt-1 flex items-center gap-1 ${
                        msg.senderType === 'seller'
                          ? 'mr-1 justify-end'
                          : 'ml-1'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
                <div ref={scrollAnchorRef} />
              </div>

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSendMessage={handleSend}
              />
            </>
          ) : (
            <div className="flex-1 flex justify-center items-center text-gray-400 text-sm">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
