'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@user-ui/context/websocket-context';
import useRequireAuth from '@user-ui/hooks/useRequiredAuth';
import ChatInput from '@user-ui/shared/components/chats/chatInput';
import {
  Chat,
  Message,
  User,
  WebSocketPayload,
  WebSocketIncomingMessage,
} from '@user-ui/types/types';
import axiosInstance from '@user-ui/utils/axiosInstance';
import { isProtected } from '@user-ui/utils/protected';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';

const Inbox = () => {
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useRequireAuth();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(false);
  const conversationId = searchParams.get('conversationId');
  const { ws, unreadCounts } = useWebSocket();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await axiosInstance.get(
        '/chatting/api/get-user-conversations',
        isProtected,
      );
      return res.data.conversations;
    },
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await axiosInstance.get(
        `/chatting/api/get-user-messages/${conversationId}?page=1`,
        isProtected,
      );
      setPage(1);
      setHasMore(res.data.hasMore);
      setHasFetchedOnce(true);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
  });

  const loadMoreMessages = async () => {
    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-user-messages/${conversationId}?page=${nextPage}`,
      isProtected,
    );

    queryClient.setQueryData(
      ['messages', conversationId],
      (old: Message[] = []) => [...res.data.messages.reverse(), ...old],
    );

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  useEffect(() => {
    if (conversations) setChats(conversations);
  }, [conversations]);

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
      }, 0);
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const payload: WebSocketPayload = {
      fromUserId: user?.id || '',
      toUserId: selectedChat.seller.id,
      conversationId: selectedChat.conversationId,
      messageBody: message,
      senderType: 'user',
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

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data: WebSocketIncomingMessage = JSON.parse(event.data);

      if (data.type === 'NEW_MESSAGE') {
        const newMsg: Message = {
          content: data.payload.content || '',
          senderType: data.payload.senderType,
          createdAt: data.payload.createdAt || new Date().toISOString(),
          conversationId: data.payload.conversationId,
          seen: false,
        };

        queryClient.setQueryData(
          ['messages', newMsg.conversationId],
          (old: Message[] = []) => [...old, newMsg],
        );

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.conversationId === newMsg.conversationId
              ? { ...chat, lastMessage: newMsg.content }
              : chat,
          ),
        );
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

  const handleChatSelect = async (chat: Chat) => {
    setHasFetchedOnce(false);
    setChats((prev) =>
      prev.map((c) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
    router.push(`?conversationId=${chat.conversationId}`);
    ws?.send(
      JSON.stringify({
        type: 'MARK_AS_SEEN',
        conversationId: chat.conversationId,
      }),
    );
  };

  const getLastMessage = (chat: Chat) => chat?.lastMessage || '';

  return (
    <div className="w-full">
      <div className="md:w-[80%] mx-auto pt-5">
        <div className="flex h-[80vh] shadow-sm overflow-hidden">
          <div className="w-[320px] border-r border-r-gray-200 bg-gray-50">
            <div className="p-4 border-b border-b-gray-200 text-lg font-semibold text-gray-800">
              Messages
            </div>
            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="p-4 text-sm text-gray-500">Loading...</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No conversations
                </div>
              ) : (
                chats.map((chat) => {
                  const isActive =
                    selectedChat?.conversationId === chat.conversationId;

                  return (
                    <button
                      key={chat.conversationId}
                      className={`w-full text-left px-4 py-3 transition hover:bg-blue-50 ${
                        isActive ? 'bg-blue-100 hover:bg-blue-200' : ''
                      }`}
                      onClick={() => handleChatSelect(chat)}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={
                            chat.seller?.avatar ||
                            'https://ik.imagekit.io/5frbx53sr/avatar/seller-avatar.jpeg?updatedAt=1772470525820'
                          }
                          alt={chat.seller?.name}
                          width={36}
                          height={36}
                          className="rounded-full border w-[40px] h-[40px] object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-800 font-semibold">
                              {chat.seller?.name}
                            </span>
                            {chat.seller?.isOnline && (
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 truncate max-w-[170px]">
                              {getLastMessage(chat)}
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
                      selectedChat.seller?.avatar ||
                      'https://ik.imagekit.io/5frbx53sr/avatar/seller-avatar.jpeg?updatedAt=1772470525820'
                    }
                    alt={selectedChat.seller?.name}
                    width={40}
                    height={40}
                    className="rounded-full border border-gray-200 w-[40px] h-[40px] object-cover"
                  />
                  <div>
                    <h2 className="text-gray-800 font-semibold text-base">
                      {selectedChat.seller?.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedChat.seller?.isOnline ? 'Online' : 'Offline'}
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
                        className="text-xs px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded-md"
                      >
                        Load previous message
                      </button>
                    </div>
                  )}

                  {messages.map((msg: Message, index: number) => (
                    <div
                      key={index}
                      className={`flex flex-col ${
                        msg.senderType === 'user'
                          ? 'items-end ml-auto'
                          : 'items-start'
                      } max-w-[80%]`}
                    >
                      <div
                        className={`${msg.senderType === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} px-4 py-2 rounded-lg shadow-sm w-fit`}
                      >
                        {msg.content}
                      </div>
                      <div
                        className={`text-[11px] text-gray-400 mt-1 flex items-center gap-1 ${
                          msg.senderType === 'user'
                            ? 'mr-1 justify-end'
                            : 'ml-1'
                        }`}
                      >
                        {msg.time ||
                          new Date(msg.createdAt).toLocaleTimeString([], {
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
    </div>
  );
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="animate-spin rounded-full w-12 h-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <Inbox />
    </Suspense>
  );
}
