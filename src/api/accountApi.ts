import { useAuthStore } from "../store/auth/auth.store";
import { API_ENDPOINTS } from "../utils/constant";

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const DEFAULT_COUNTRY_CODE = "+91";

export function withCountryCode(phone: string): string {
  const trimmed = phone.trim();
  return trimmed.startsWith("+")
    ? trimmed
    : `${DEFAULT_COUNTRY_CODE}${trimmed}`;
}

export interface Account {
  user_id: string;
  display_name: string | null;
  email: string | null;
  profile_picture: string | null;
  status: string | null;
  isLocked: boolean;
  passkey_hash?: string;
  phone_number: string | null;
}

export interface CreateAccountPayload {
  identifierType: "username" | "email" | "phone";
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface CreateAccountResponse {
  message: string;
  id?: string;
  username?: string;
  delivery_medium?: string;
}

export interface VerifySubUserOtpPayload {
  email: string;
  phone: string;
  otp: string;
  username?: string;
}

export interface VerifySubUserOtpResponse {
  success: boolean;
  message: string;
}

export interface DeleteAccountResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateUserLockResponse {
  message: string;
}

export interface SubUserAccessDetail {
  user_id: string;
  sub_users: Account[];
}

export interface UpdateUserAccessResponse {
  message?: string;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchAccounts(): Promise<Account[]> {
  const response = await fetch(API_ENDPOINTS.ACCOUNTS_LIST, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not load accounts.";
    throw new Error(message);
  }

  if (Array.isArray(data)) return data as Account[];
  if (data && Array.isArray((data as { sub_users?: unknown }).sub_users)) {
    return (data as { sub_users: Account[] }).sub_users;
  }
  if (data && Array.isArray((data as { accounts?: unknown }).accounts)) {
    return (data as { accounts: Account[] }).accounts;
  }
  if (data && Array.isArray((data as { users?: unknown }).users)) {
    return (data as { users: Account[] }).users;
  }
  return [];
}

export async function createAccount(
  payload: CreateAccountPayload,
): Promise<CreateAccountResponse> {
  const body: Record<string, unknown> = {
    operation: "signup",
    password: payload.password,
  };

  if (payload.identifierType === "username") {
    body.username = payload.username;
  } else if (payload.identifierType === "phone") {
    body.phone_number = withCountryCode(payload.phone);
  }

  if (payload.identifierType === "email") {
    body.email = payload.email;
  } else {
    const userDetail = useAuthStore.getState().userDetails;
    body.email = userDetail?.email;
  }

  const response = await fetch(API_ENDPOINTS.AUTH_SUB_USERS, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not create account.";
    throw new Error(message);
  }

  return data as CreateAccountResponse;
}

export async function verifySubUserOtp(
  payload: VerifySubUserOtpPayload,
): Promise<VerifySubUserOtpResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH_SUB_USERS, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      operation: "verify",
      email: payload.email,
      phone_number: withCountryCode(payload.phone),
      otp: payload.otp,
      ...(payload.username ? { username: payload.username } : {}),
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message || "Could not verify OTP.";
    throw new Error(message);
  }

  return data as VerifySubUserOtpResponse;
}

export async function deleteAccount(
  subUserId: string,
): Promise<DeleteAccountResponse> {
  const response = await fetch(API_ENDPOINTS.USER_ACCESS, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ sub_user_id: subUserId }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not remove account.";
    throw new Error(message);
  }

  return data as DeleteAccountResponse;
}

export async function changePassword(
  userId: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<ChangePasswordResponse> {
  const response = await fetch(
    `${API_ENDPOINTS.SECONDARY_USER_PASSWORD_CHANGE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        operation: "reset_password",
        username: userId,
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      }),
    },
  );

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not change password.";
    throw new Error(message);
  }

  return data as ChangePasswordResponse;
}

export async function updateUserLock(
  userId: string,
  isLocked: boolean,
  encryptedPasskey: string,
): Promise<UpdateUserLockResponse> {
  const response = await fetch(`${API_ENDPOINTS.USER_HOME}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      isLocked,
      passkey_hash: encryptedPasskey,
      target_user: userId,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not update lock settings.";
    throw new Error(message);
  }

  return data as UpdateUserLockResponse;
}

export async function fetchSubUserAccessDetail(
  targetUserId: string,
): Promise<SubUserAccessDetail> {
  const response = await fetch(
    `${API_ENDPOINTS.ACCOUNTS_LIST}?target_user=${encodeURIComponent(targetUserId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    },
  );

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not load sub-account access.";
    throw new Error(message);
  }

  return data as SubUserAccessDetail;
}

export async function updateUserAccess(
  targetUserId: string,
  subUserIds: string[],
): Promise<UpdateUserAccessResponse> {
  const response = await fetch(API_ENDPOINTS.USER_ACCESS, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      target_user: targetUserId,
      sub_users: subUserIds,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not update sub-account access.";
    throw new Error(message);
  }

  return data as UpdateUserAccessResponse;
}
