import { create } from 'zustand';


type UserProfile = {
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  theme: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  last_login: string | null;
  profile: UserProfile;
};

type UserStore = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));