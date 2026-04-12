// src/store/uiStore.ts — UI State
// ============================================================
// FIXED:
//   - activePage and activeTab are NOT persisted — they always reset to
//     'home' / 'overview' on every page load / fresh login.
//     Previously if anything wrote activePage='my-health' it would survive
//     a full page refresh, making the dashboard always land on My Health.
//   - sidebarOpen IS persisted (user preference should survive refresh).
//   - Added resetToHome() — call this after successful login/register.
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  authModal: 'login' | 'register' | 'forgot' | null;
  activePage: string;
  activeTab: string;
  toggleSidebar: () => void;
  openAuthModal: (type: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  setActivePage: (page: string) => void;
  setActiveTab: (tab: string) => void;
  resetToHome: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      authModal:   null,
      activePage:  'home',      // always starts at home — not persisted
      activeTab:   'overview',  // always starts at overview — not persisted

      toggleSidebar:  () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      openAuthModal:  (type) => set({ authModal: type }),
      closeAuthModal: () => set({ authModal: null }),
      setActivePage:  (page) => set({ activePage: page }),
      setActiveTab:   (tab)  => set({ activeTab: tab }),

      // Call after login / register to guarantee user lands on Home
      resetToHome: () => set({ activePage: 'home', activeTab: 'overview' }),
    }),
    {
      name: 'hc-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist sidebar preference — never persist activePage/activeTab
      // so the dashboard always opens on Home regardless of last visited page
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);

// ============================================================
