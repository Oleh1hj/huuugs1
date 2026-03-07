// ─── Domain types (mirrored from server entities) ────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  birth: string;       // ISO date
  city: string;
  photo: string | null;
  bio: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userAId: string;
  userBId: string;
  userA: User;
  userB: User;
  createdAt: string;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

// ─── API response types ───────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LikeResult {
  liked: boolean;
  match: boolean;
  conversationId?: string;
}

// ─── UI types ────────────────────────────────────────────────────

export type Lang = 'ua' | 'by' | 'pl' | 'en';
export type TabKey = 'search' | 'likes' | 'chats' | 'profile';
