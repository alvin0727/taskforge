import { create } from 'zustand';
import { User } from '@/lib/types/user';

type UserStore = {
  user: User | null;
  setUser: (user: User) => void;
  updateUserFields: (fields: Partial<User>) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUserFields: (fields) => set((state) => ({
    user: state.user ? { ...state.user, ...fields } : state.user
  })),
  clearUser: () => set({ user: null }),
}));