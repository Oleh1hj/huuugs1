import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/types';
import { chatsApi } from '@/api/chats.api';

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.user);
  const showMatch = useUiStore((s) => s.showMatch);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SOCKET] connected ✅', socket.id);
      // Refetch messages to catch any missed while disconnected
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    socket.on('connect_error', (err) => console.error('[SOCKET] connect_error ❌', err.message));
    socket.on('disconnect', (reason) => console.warn('[SOCKET] disconnected:', reason));

    // Real-time message → update cache (replace any temp optimistic entry)
    socket.on('message', (msg: Message) => {
      queryClient.setQueryData<Message[]>(
        ['messages', msg.conversationId],
        (old) => {
          const filtered = (old ?? []).filter((m) => !m.id.startsWith('temp-') || m.senderId !== msg.senderId || m.text !== msg.text);
          // avoid duplicate if already present (e.g. from a re-render)
          if (filtered.some((m) => m.id === msg.id)) return filtered;
          return [...filtered, msg];
        },
      );
      // Bump conversation list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Match notification from server
    socket.on('match', (payload: {
      partnerId: string; partnerName: string;
      partnerPhoto: string | null; conversationId: string;
    }) => {
      showMatch(payload);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('message');
      socket.off('match');
    };
  }, [isAuthenticated, queryClient, showMatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return socketRef;
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  return async (text: string) => {
    // 1. Optimistic update — sender sees message immediately
    const tempId = `temp-${Date.now()}`;
    queryClient.setQueryData<Message[]>(
      ['messages', conversationId],
      (old) => [...(old ?? []), { id: tempId, conversationId, senderId: me?.id ?? '', text, isRead: false, createdAt: new Date().toISOString() }],
    );

    try {
      // 2. Save via HTTP — server persists to DB AND emits socket to other user
      console.log('[MSG] sending via HTTP...');
      const saved = await chatsApi.sendMessage(conversationId, text);
      console.log('[MSG] HTTP success, saved id:', saved.id);
      // Replace temp with real saved message
      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (old) => {
          const filtered = (old ?? []).filter((m) => m.id !== tempId);
          if (filtered.some((m) => m.id === saved.id)) return filtered;
          return [...filtered, saved];
        },
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err: any) {
      // HTTP failed — fall back to socket emit (gateway will save + broadcast)
      console.error('[MSG] HTTP failed:', err?.response?.status, err?.message);
      const sock = getSocket();
      console.log('[MSG] socket connected:', sock.connected, '— falling back to socket emit');
      sock.emit('message', { conversationId, text });
    }
  };
}

export function useTyping(conversationId: string) {
  return () => {
    const socket = getSocket();
    socket.emit('typing', conversationId);
  };
}
