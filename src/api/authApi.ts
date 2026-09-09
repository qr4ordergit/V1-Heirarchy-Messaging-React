import { AxiosError } from "axios";
import { api } from "./axios";
import { API_ENDPOINTS } from "../utils/constant";
import { LOGOUT_REDIRECT_URI } from "../config/cognito";

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
  success: boolean;
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

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;

    return data?.message || data?.error || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

async function postAuth<TResponse>(
  body: Record<string, unknown>,
): Promise<TResponse> {
  try {
    const response = await api.post<TResponse>(API_ENDPOINTS.AUTH, body);

    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Something went wrong. Please try again."),
    );
  }
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
  try {
    const response = await api.post<UsernameSuggestResponse>(
      API_ENDPOINTS.AUTH_USERNAME_SUGGEST,
      { username },
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not check username."));
  }
}

export async function logout(): Promise<LogoutResponse> {
  const logoutUrl = `${API_ENDPOINTS.AUTH_LOGOUT}?redirect_uri=${encodeURIComponent(LOGOUT_REDIRECT_URI)}`;

  try {
    const response = await api.post<LogoutResponse>(logoutUrl);

    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Could not log out. Please try again."),
    );
  }
}
