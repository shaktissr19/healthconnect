// src/store/uiStore.ts — UI State
// ============================================================
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  authModal: 'login' | 'register' | null;
  activePage: string;
  activeTab: string;
  toggleSidebar: () => void;
  openAuthModal: (type: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setActivePage: (page: string) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  authModal: null,
  activePage: 'home',
  activeTab: 'overview',

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  openAuthModal:  (type) => set({ authModal: type }),
  closeAuthModal: () => set({ authModal: null }),
  setActivePage:  (page) => set({ activePage: page }),
  setActiveTab:   (tab)  => set({ activeTab: tab }),
}));

// ============================================================
