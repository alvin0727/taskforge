import { create } from 'zustand';

interface SidebarState {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
  toggle: () => set((state) => ({ hidden: !state.hidden })),
}));
