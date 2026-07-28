import { AUTH_API_URL } from "../config/api";

export interface SignupPayload {
  email: string;
  password: string;
  //   group_name: string;
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

interface ApiErrorBody {
  message?: string;
  error?: string;
}

async function postAuth<TResponse>(
  body: Record<string, unknown>,
): Promise<TResponse> {
  const response = await fetch(AUTH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // response had no JSON body
  }

  if (!response.ok) {
    const errorBody = data as ApiErrorBody | null;
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
