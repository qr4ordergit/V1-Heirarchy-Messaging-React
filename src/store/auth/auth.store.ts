import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

import type { Account } from "../../api/accountApi";
import type { ActiveSession } from "../../api/sessionApi";

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface UserDetails {
  success: boolean;
  username: string;
  display_name?: string | null;
  description?: string | null;
  phone_number: string | null;
  email: string;
  group_name: string | null;
  profile_picture: string | null;
  isLocked?: boolean;
  passkey_hash?: string | null;
  is_paid?: boolean;
}

export const isHubAccount = (details: UserDetails | null | undefined) =>
  details?.group_name === "hub";

export const isAdminAccount = (details: UserDetails | null | undefined) =>
  details?.group_name === "admins";

interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;

  isAuthenticated: boolean;

  userDetails: UserDetails | null;

  target_user: string;

  targetUserDetails: Account | null;

  // Multi-device login: true while this login has not been accepted by the
  // backend (still checking, or the 5-device limit was hit).
  sessionPending: boolean;
  pendingSessions: ActiveSession[] | null;
  sessionMessage: string;

  setSessionPending: (pending: boolean) => void;
  setSessionLimit: (sessions: ActiveSession[] | null, message?: string) => void;

  setTokens: (tokens: AuthTokens) => void;

  setUserDetails: (details: UserDetails) => void;

  setTargetUser: (target_user: string) => void;

  setTargetUserDetails: (targetUserDetails: Account | null) => void;

  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        idToken: null,
        refreshToken: null,

        sessionPending: false,
        pendingSessions: null,
        sessionMessage: "",

        isAuthenticated: false,

        userDetails: null,

        target_user: "",

        targetUserDetails: null,

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
          set(
            {
              userDetails: details,
            },
            false,
            "auth/setUserDetails",
          ),

        setTargetUser: (target_user) =>
          set(
            {
              target_user,
            },
            false,
            "auth/setTargetUser",
          ),

        setTargetUserDetails: (targetUserDetails) =>
          set(
            {
              targetUserDetails,
            },
            false,
            "auth/setTargetUserDetails",
          ),

        setSessionPending: (pending) =>
          set({ sessionPending: pending }, false, "auth/setSessionPending"),

        setSessionLimit: (sessions, message = "") =>
          set(
            { pendingSessions: sessions, sessionMessage: message },
            false,
            "auth/setSessionLimit",
          ),

        clearTokens: () =>
          set(
            {
              accessToken: null,
              idToken: null,
              refreshToken: null,

              isAuthenticated: false,

              sessionPending: false,
              pendingSessions: null,
              sessionMessage: "",

              userDetails: null,

              target_user: "",

              targetUserDetails: null,
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

          sessionPending: state.sessionPending,

          userDetails: state.userDetails,

          target_user: state.target_user,

          targetUserDetails: state.targetUserDetails,
        }),
      },
    ),
    {
      name: "AuthStore",
      enabled: import.meta.env.DEV,
    },
  ),
);
