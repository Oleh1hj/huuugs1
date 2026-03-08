import { api } from '@/lib/api';
import { SupportMessage, SupportConversation } from '@/types';

export const supportApi = {
  // User
  getMyChat: () => api.get<SupportMessage[]>('/support/my').then((r) => r.data),
  sendMessage: (text: string) => api.post<SupportMessage>('/support/message', { text }).then((r) => r.data),
  getUnread: () => api.get<{ count: number }>('/support/unread').then((r) => r.data),

  // Admin
  getConversations: () => api.get<SupportConversation[]>('/support/admin/conversations').then((r) => r.data),
  getConversation: (userId: string) => api.get<SupportMessage[]>(`/support/admin/conversation/${userId}`).then((r) => r.data),
  adminReply: (userId: string, text: string) => api.post<SupportMessage>(`/support/admin/reply/${userId}`, { text }).then((r) => r.data),
  getAdminUnread: () => api.get<{ count: number }>('/support/admin/unread').then((r) => r.data),
};
