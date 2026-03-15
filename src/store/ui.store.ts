import { create } from 'zustand';
import { Lang } from '@/types';

interface MatchNotif {
  partnerId: string;
  partnerName: string;
  partnerPhoto: string | null;
  conversationId: string;
}

export interface LikeNotif {
  fromId: string;
  fromName: string;
  fromPhoto: string | null;
}

interface UiState {
  lang: Lang;
  matchNotif: MatchNotif | null;
  likeQueue: LikeNotif[];

  setLang: (lang: Lang) => void;
  showMatch: (notif: MatchNotif) => void;
  dismissMatch: () => void;
  enqueueLike: (notif: LikeNotif) => void;
  dequeueLike: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  lang: (localStorage.getItem('huugs-lang') as Lang) ?? 'ua',
  matchNotif: null,
  likeQueue: [],

  setLang: (lang) => {
    localStorage.setItem('huugs-lang', lang);
    set({ lang });
  },
  showMatch: (notif) => set({ matchNotif: notif }),
  dismissMatch: () => set({ matchNotif: null }),
  enqueueLike: (notif) => set((s) => ({ likeQueue: [...s.likeQueue, notif] })),
  dequeueLike: () => set((s) => ({ likeQueue: s.likeQueue.slice(1) })),
}));
