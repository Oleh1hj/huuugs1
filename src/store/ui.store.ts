import { create } from 'zustand';
import { Lang } from '@/types';

interface MatchNotif {
  partnerId: string;
  partnerName: string;
  partnerPhoto: string | null;
  conversationId: string;
}

interface UiState {
  lang: Lang;
  matchNotif: MatchNotif | null;

  setLang: (lang: Lang) => void;
  showMatch: (notif: MatchNotif) => void;
  dismissMatch: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  lang: (localStorage.getItem('huugs-lang') as Lang) ?? 'ua',
  matchNotif: null,

  setLang: (lang) => {
    localStorage.setItem('huugs-lang', lang);
    set({ lang });
  },
  showMatch: (notif) => set({ matchNotif: notif }),
  dismissMatch: () => set({ matchNotif: null }),
}));
