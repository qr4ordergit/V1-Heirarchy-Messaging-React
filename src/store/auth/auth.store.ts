import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface UserDetails {
  success: boolean;
  username: string;
  groups: string[];
  token_use: string;
  client_id: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  userDetails: UserDetails | null;
  setTokens: (tokens: AuthTokens) => void;
  setUserDetails: (details: UserDetails) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
      userDetails: null,

      setTokens: ({ accessToken, idToken, refreshToken }) =>
        set({ accessToken, idToken, refreshToken, isAuthenticated: true }),

      setUserDetails: (details) => set({ userDetails: details }),

      clearTokens: () =>
        set({
          accessToken: null,
          idToken: null,
          refreshToken: null,
          isAuthenticated: false,
          userDetails: null,
        }),
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) =>
          sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
);
