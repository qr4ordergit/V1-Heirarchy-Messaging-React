import { useAuthStore, isHubAccount } from "../store/auth/auth.store";
import { fetchUserDetails } from "../api/userApi";
import { registerSession } from "../api/sessionApi";
import type { RegisterSessionResult } from "../api/sessionApi";
import { ROUTES } from "../router/routes";

export interface OAuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

let inFlightCheck: Promise<RegisterSessionResult> | null = null;

export function checkSession(): Promise<RegisterSessionResult> {
  if (inFlightCheck) return inFlightCheck;

  const { accessToken, refreshToken, setSessionPending, setSessionLimit } =
    useAuthStore.getState();

  if (!accessToken) return Promise.reject(new Error("Not signed in."));

  inFlightCheck = registerSession(accessToken, refreshToken ?? "")
    .then((result) => {
      if (result.status === "ok") {
        setSessionLimit(null);
        setSessionPending(false);
      } else {
        setSessionLimit(result.sessions, result.message);
        setSessionPending(true);
      }
      return result;
    })
    .finally(() => {
      inFlightCheck = null;
    });

  return inFlightCheck;
}

export function establishSession(
  tokens: OAuthTokens,
): Promise<RegisterSessionResult> {
  const { setTokens, setSessionPending, setSessionLimit } =
    useAuthStore.getState();

  setTokens(tokens);
  setSessionLimit(null);

  setSessionPending(true);

  return checkSession();
}

export async function completeLogin(tokens: OAuthTokens): Promise<string> {
  const result = await establishSession(tokens);
  if (result.status === "limit_reached") return ROUTES.SESSIONS;

  const { setUserDetails } = useAuthStore.getState();
  const details = await fetchUserDetails();
  setUserDetails(details);

  return isHubAccount(details) ? ROUTES.ACCOUNTS : `/${ROUTES.CHATS}`;
}
