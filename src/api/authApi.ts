import { API_ENDPOINTS } from "../utils/constant";
import { useAuthStore } from "../store/auth/auth.store";
export interface SignupPayload {
  email: string;
  password: string;
  group_name: string;
}

export interface SignupResponse {
  message: string;
  delivery_medium: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface UsernameSuggestResponse {
  success: boolean;
  message: string;
  suggestions: string[];
}

export interface LogoutResponse {
  message: string;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function postAuth<TResponse>(
  body: Record<string, unknown>,
): Promise<TResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const errorBody = data as { message?: string; error?: string } | null;
    const message =
      errorBody?.message ||
      errorBody?.error ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data as TResponse;
}

export function signup(payload: SignupPayload) {
  return postAuth<SignupResponse>({ operation: "signup", ...payload });
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return postAuth<VerifyOtpResponse>({ operation: "verify", ...payload });
}

export async function suggestUsername(
  username: string,
): Promise<UsernameSuggestResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH_USERNAME_SUGGEST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not check username.";
    throw new Error(message);
  }

  return data as UsernameSuggestResponse;
}
export async function logout(): Promise<LogoutResponse> {
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not log out. Please try again.";
    throw new Error(message);
  }

  return data as LogoutResponse;
}
