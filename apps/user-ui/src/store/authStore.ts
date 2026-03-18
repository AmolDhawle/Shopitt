import { create } from 'zustand';

type AuthState = {
  user: any | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  setUser: (user: any | null) => void;
  setLoggedIn: (value: boolean) => void;
  setLoading: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isLoggedIn: !!user,
      isLoading: false,
    }),

  setLoggedIn: (value) => set({ isLoggedIn: value }),
  setLoading: (value) => set({ isLoading: value }),
}));
