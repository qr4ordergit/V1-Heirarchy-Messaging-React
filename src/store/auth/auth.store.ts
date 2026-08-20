import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import type { Account } from "../../api/accountApi";

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface UserDetails {
  success: boolean;
  username: string;
  phone_number: string | null;
  email: string;
  group_name: string | null;
  profile_picture: string | null;
}

export const isHubAccount = (details: UserDetails | null | undefined) =>
  (details?.group_name ?? "").toLowerCase() === "hub";

interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  userDetails: UserDetails | null;
  target_user: string;
  targetUserDetails : Account | null;
  setTokens: (tokens: AuthTokens) => void;
  setUserDetails: (details: UserDetails) => void;
  setTargetUser: (target_user: string) => void;
  setTargetUserDetails: (targetUserDetails: Account) => void;
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
        targetUserDetails : null,

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

        setTargetUser: (target_user) =>
          set({ target_user }, false, "auth/traget_user"),

        setTargetUserDetails: (targetUserDetails) =>
          set({ targetUserDetails }, false, "auth/traget_user_details"),

        clearTokens: () =>
          set(
            {
              accessToken: null,
              idToken: null,
              refreshToken: null,
              isAuthenticated: false,
              userDetails: null,
              target_user: "",
              targetUserDetails : null
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
          target_user: state.target_user,
          targetUserDetails: state.targetUserDetails,
        }),
      },
    ),
    { name: "AuthStore", enabled: import.meta.env.DEV },
  ),
);
