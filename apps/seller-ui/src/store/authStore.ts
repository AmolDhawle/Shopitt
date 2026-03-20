import { create } from 'zustand';

type AuthState = {
  seller: any | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  setSeller: (seller: any | null) => void;
  setLoggedIn: (value: boolean) => void;
  setLoading: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  seller: null,
  isLoggedIn: false,
  isLoading: true,

  setSeller: (seller) =>
    set({
      seller,
      isLoggedIn: !!seller,
      isLoading: false,
    }),

  setLoggedIn: (value) => set({ isLoggedIn: value }),
  setLoading: (value) => set({ isLoading: value }),
}));
