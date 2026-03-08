import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/types';

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

    // Real-time message → update cache
    socket.on('message', (msg: Message) => {
      queryClient.setQueryData<Message[]>(
        ['messages', msg.conversationId],
        (old) => [...(old ?? []), msg],
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
  return (text: string) => {
    const socket = getSocket();
    socket.emit('message', { conversationId, text });
  };
}

export function useTyping(conversationId: string) {
  return () => {
    const socket = getSocket();
    socket.emit('typing', conversationId);
  };
}
