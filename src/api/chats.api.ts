import { api } from '@/lib/api';
import { Conversation, Message } from '@/types';

export const chatsApi = {
  getConversations: () =>
    api.get<Conversation[]>('/chats').then((r) => r.data),

  getMessages: (conversationId: string, params?: { limit?: number; before?: string }) =>
    api.get<Message[]>(`/chats/${conversationId}/messages`, { params }).then((r) => r.data),

  markAsRead: (conversationId: string) =>
    api.patch(`/chats/${conversationId}/read`),
};
