import { useCallback, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router";

import { COGNITO_LOGIN_URL } from "../config/cognito";
import { fetchUserDetails } from "../api/userApi";
import { ROUTES } from "../router/routes";
import { useAuthStore, isAdminAccount } from "../store/auth/auth.store";

export function useLogin() {
  const navigate = useNavigate();
  const [loggingIn, setLoggingIn] = useState(false);

  const enterWithStoredTokens = useCallback(async (): Promise<boolean> => {
    const { accessToken, refreshToken, sessionPending, setUserDetails } =
      useAuthStore.getState();

    if (!accessToken || !refreshToken) return false;

    if (sessionPending) {
      navigate(ROUTES.SESSIONS, { replace: true });
      return true;
    }

    try {
      const details = await fetchUserDetails();
      setUserDetails(details);
      navigate(isAdminAccount(details) ? ROUTES.ADMIN : ROUTES.ACCOUNTS, {
        replace: true,
      });
      return true;
    } catch {
      useAuthStore.getState().clearTokens();
      return false;
    }
  }, [navigate]);

  const startLogin = useCallback(
    async (event?: MouseEvent) => {
      event?.preventDefault();
      setLoggingIn(true);
      const entered = await enterWithStoredTokens();
      if (!entered) window.location.href = COGNITO_LOGIN_URL;
      else setLoggingIn(false);
    },
    [enterWithStoredTokens],
  );

  return { startLogin, enterWithStoredTokens, loggingIn };
}
