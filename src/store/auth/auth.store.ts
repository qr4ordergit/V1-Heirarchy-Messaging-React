import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
  devtools(
    (set) => ({
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
      userDetails: null,

      setTokens: (tokens) =>
        set(
          {
            accessToken: tokens.accessToken,
            idToken: tokens.idToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
          },
          false,
          "auth/setTokens",
        ),

      setUserDetails: (details) =>
        set({ userDetails: details }, false, "auth/setUserDetails"),

      clearTokens: () =>
        set(
          {
            accessToken: null,
            idToken: null,
            refreshToken: null,
            isAuthenticated: false,
            userDetails: null,
          },
          false,
          "auth/clearTokens",
        ),
    }),
    { name: "AuthStore", enabled: import.meta.env.DEV },
  ),
);
