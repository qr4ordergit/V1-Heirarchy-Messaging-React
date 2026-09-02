import { useAuthStore } from "../store/auth/auth.store";
import { API_ENDPOINTS } from "../utils/constant";

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
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
  phone_number: string | null;
  description?: string | null;
  group_name?: string | null;
  status: string | null;
  isLocked: boolean;
  passkey_hash?: string;
}

export interface SubUserAccessDetail {
  user_id: string;
  sub_users: Account[];
}

export interface CreateAccountPayload {
  identifierType: "username" | "email" | "phone";
  username: string;
  email: string;
  phone: string;
  password: string;
  displayName?: string;
  description?: string;
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

export interface UpdateUserAccessResponse {
  message?: string;
}

export interface UpdateProfilePayload {
  display_name?: string;
  email?: string;
  description?: string;
  profile_picture?: string;
  phone_number?: string;
  status?: string;
  isLocked?: boolean;
  passkey_hash?: string;
}

export interface UpdateProfileResponse {
  message?: string;
  updated_fields?: string[];
  profile_picture_upload_url?: string;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  const parsed = data as { message?: string; error?: string } | null;
  return parsed?.message || parsed?.error || fallback;
}

export async function fetchSubUserAccessDetail(): Promise<SubUserAccessDetail> {
  const response = await fetch(API_ENDPOINTS.ACCOUNTS_LIST, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Could not load accounts."));
  }

  return data as SubUserAccessDetail;
}

export async function fetchAccounts(): Promise<Account[]> {
  const result = await fetchSubUserAccessDetail();

  return Array.isArray(result.sub_users) ? result.sub_users : [];
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

  if (payload.displayName?.trim()) {
    body.display_name = payload.displayName.trim();
  }

  if (payload.description?.trim()) {
    body.description = payload.description.trim();
  }

  const response = await fetch(API_ENDPOINTS.AUTH_SUB_USERS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Could not create account."));
  }

  return data as CreateAccountResponse;
}

export async function verifySubUserOtp(
  payload: VerifySubUserOtpPayload,
): Promise<VerifySubUserOtpResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH_SUB_USERS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
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
    throw new Error(extractErrorMessage(data, "Could not verify OTP."));
  }

  return data as VerifySubUserOtpResponse;
}

export async function deleteAccount(
  subUserId: string,
): Promise<DeleteAccountResponse> {
  const response = await fetch(API_ENDPOINTS.USER_ACCESS, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      sub_user_id: subUserId,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Could not remove account."));
  }

  return data as DeleteAccountResponse;
}

export async function changePassword(
  userId: string,
  newPassword: string,
  confirmNewPassword: string,
  isSelf: boolean = false,
): Promise<ChangePasswordResponse> {
  const response = await fetch(API_ENDPOINTS.SECONDARY_USER_PASSWORD_CHANGE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      operation: "reset_password",

      ...(isSelf ? {} : { username: userId }),
      new_password: newPassword,
      confirm_password: confirmNewPassword,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Could not change password."));
  }

  return data as ChangePasswordResponse;
}

export async function updateUserLock(
  isLocked: boolean,
  encryptedPasskey: string,
  targetUserId?: string,
): Promise<UpdateUserLockResponse> {
  const body: Record<string, unknown> = {
    isLocked,
    passkey_hash: encryptedPasskey,
  };

  if (targetUserId) {
    body.target_user = targetUserId;
  }

  const response = await fetch(API_ENDPOINTS.USER_HOME_PASSKEY, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Could not update lock settings."),
    );
  }

  return data as UpdateUserLockResponse;
}

export async function updateUserProfile(
  payload: UpdateProfilePayload,
  targetUserId?: string,
): Promise<UpdateProfileResponse> {
  const body: Record<string, unknown> = { ...payload };

  if (targetUserId) {
    body.target_user = targetUserId;
  }

  const response = await fetch(API_ENDPOINTS.USER_HOME, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Could not update profile."));
  }

  return data as UpdateProfileResponse;
}

export interface BulkRegistrationUploadResponse {
  message?: string;
  job_id: string;
}

export interface BulkRegistrationError {
  row?: number;
  username?: string;
  message: string;
}

export type BulkRegistrationStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface BulkRegistrationStatusResponse {
  job_id: string;
  total: number;
  created: number;
  errors: BulkRegistrationError[];
  status: BulkRegistrationStatus | string;
}

export async function bulkRegisterSubUsers(
  file: File,
): Promise<BulkRegistrationUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(API_ENDPOINTS.AUTH_SUB_USERS_BULK, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Could not process the bulk upload."),
    );
  }

  const result = data as BulkRegistrationUploadResponse | null;

  if (!result?.job_id) {
    throw new Error("Could not process the bulk upload.");
  }

  return result;
}

export async function getBulkRegistrationStatus(
  jobId: string,
): Promise<BulkRegistrationStatusResponse> {
  const response = await fetch(
    `${API_ENDPOINTS.AUTH_SUB_USERS_BULK}/${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    },
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Could not check the upload status."),
    );
  }

  return data as BulkRegistrationStatusResponse;
}

export async function updateUserAccess(
  targetUserId: string,
  subUserIds: string[],
): Promise<UpdateUserAccessResponse> {
  const response = await fetch(API_ENDPOINTS.USER_ACCESS, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      target_user: targetUserId,
      sub_users: subUserIds,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Could not update sub-account access."),
    );
  }

  return data as UpdateUserAccessResponse;
}
