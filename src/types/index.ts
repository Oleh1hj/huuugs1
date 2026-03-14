// ─── Domain types (mirrored from server entities) ────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  birth: string;       // ISO date
  city: string;
  photo: string | null;
  photos: string[];    // carousel photos (up to 5)
  bio: string | null;
  gender: string;      // 'male' | 'female'
  language: string;
  country: string | null;
  lookingForGender: string; // 'male' | 'female' | 'any'
  lookingForCity: string | null;
  lookingForAgeMin: number | null;
  lookingForAgeMax: number | null;
  whoCanContact: string; // 'anyone' | 'liked_me' | 'mutual'
  // Contact filters
  contactFilterGender: string;
  contactFilterAgeMin: number | null;
  contactFilterAgeMax: number | null;
  contactFilterSameCity: boolean;
  contactFilterSameLanguage: boolean;
  contactFilterSameCountry: boolean;
  // Virtual currency
  coins: number;
  // Status
  isVerified: boolean;
  isPremium: boolean;
  premiumUntil: string | null;
  isAdmin: boolean;
  createdAt: string;
  online?: boolean;    // runtime flag set client-side
  isSuper?: boolean;   // runtime flag: was this a super-like
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

// ─── Group chat types ─────────────────────────────────────────────

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  maxMembers: number;
  createdAt: string;
  memberCount?: number;
  lastMessage?: GroupMessage | null;
  myRole?: string; // 'admin' | 'member'
}

export interface GroupMember extends User {
  role: string; // 'admin' | 'member'
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string | null;
  text: string;
  createdAt: string;
  sender?: User;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string | null;
  type: 'invite' | 'request';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  group?: GroupChat;
  fromUser?: User;
  toUser?: User;
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

export interface SuperLikeResult {
  success: boolean;
  coinsLeft: number;
  match: boolean;
  conversationId?: string;
}

export interface SupportMessage {
  id: string;
  userId: string;
  text: string;
  fromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface SupportConversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

// ─── UI types ────────────────────────────────────────────────────

export type Lang = 'ua' | 'by' | 'pl' | 'en';
export type TabKey = 'search' | 'likes' | 'chats' | 'profile';
