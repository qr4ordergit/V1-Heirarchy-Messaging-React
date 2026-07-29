const AUTH_API_URL =
  "https://io85vyk8x6.execute-api.ap-south-1.amazonaws.com/dev/api/auth";

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
  const response = await fetch(AUTH_API_URL, {
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
