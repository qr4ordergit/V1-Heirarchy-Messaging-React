import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

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
  profile_url?: string;
}

interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  userDetails: UserDetails | null;
  target_user : string;
  setTokens: (tokens: AuthTokens) => void;
  setUserDetails: (details: UserDetails) => void;
  setTargetUser: (target_user: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        idToken: null,
        refreshToken: null,
        isAuthenticated: false,
        userDetails: null,
        target_user: "",

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

        setTargetUser: (target_user) => set({target_user},false,"auth/traget_user"),

        clearTokens: () =>
          set(
            {
              accessToken: null,
              idToken: null,
              refreshToken: null,
              isAuthenticated: false,
              userDetails: null,
              target_user : ""
            },
            false,
            "auth/clearTokens",
          ),
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          accessToken: state.accessToken,
          idToken: state.idToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          userDetails: state.userDetails,
          target_user : state.target_user
        }),
      },
    ),
    { name: "AuthStore", enabled: import.meta.env.DEV },
  ),
);
