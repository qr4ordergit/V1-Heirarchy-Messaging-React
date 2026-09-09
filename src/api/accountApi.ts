import { AxiosError } from "axios";
import { api } from "./axios";
import { useAuthStore } from "../store/auth/auth.store";
import { API_ENDPOINTS } from "../utils/constant";

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

export async function fetchSubUserAccessDetail(): Promise<SubUserAccessDetail> {
  try {
    const response = await api.get<SubUserAccessDetail>(
      API_ENDPOINTS.ACCOUNTS_LIST,
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not load accounts."));
  }
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

  try {
    const response = await api.post<CreateAccountResponse>(
      API_ENDPOINTS.AUTH_SUB_USERS,
      body,
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not create account."));
  }
}

export async function verifySubUserOtp(
  payload: VerifySubUserOtpPayload,
): Promise<VerifySubUserOtpResponse> {
  try {
    const response = await api.post<VerifySubUserOtpResponse>(
      API_ENDPOINTS.AUTH_SUB_USERS,
      {
        operation: "verify",
        email: payload.email,
        phone_number: withCountryCode(payload.phone),
        otp: payload.otp,
        ...(payload.username ? { username: payload.username } : {}),
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not verify OTP."));
  }
}

export async function deleteAccount(
  subUserId: string,
): Promise<DeleteAccountResponse> {
  try {
    const response = await api.delete<DeleteAccountResponse>(
      API_ENDPOINTS.USER_ACCESS,
      {
        data: {
          sub_user_id: subUserId,
        },
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not remove account."));
  }
}

export async function changePassword(
  userId: string,
  newPassword: string,
  confirmNewPassword: string,
  isSelf: boolean = false,
): Promise<ChangePasswordResponse> {
  try {
    const response = await api.post<ChangePasswordResponse>(
      API_ENDPOINTS.SECONDARY_USER_PASSWORD_CHANGE,
      {
        operation: "reset_password",
        ...(isSelf ? {} : { username: userId }),
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not change password."));
  }
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

  try {
    const response = await api.patch<UpdateUserLockResponse>(
      API_ENDPOINTS.USER_HOME_PASSKEY,
      body,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Could not update lock settings."),
    );
  }
}

export async function updateUserProfile(
  payload: UpdateProfilePayload,
  targetUserId?: string,
): Promise<UpdateProfileResponse> {
  const params = new URLSearchParams();

  if (targetUserId) {
    params.set("target_user", targetUserId);
  }

  const url = `${API_ENDPOINTS.USER_HOME}?${params.toString()}`;

  try {
    const response = await api.patch<UpdateProfileResponse>(url, payload);

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not update profile."));
  }
}

export interface BulkRegistrationUploadResponse {
  message?: string;
  job_id: string;
}

export type BulkRegistrationStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | (string & {});

export interface BulkRegistrationError {
  row?: number;
  username?: string;
  message: string;
}

export interface BulkRegistrationStatusResponse {
  job_id: string;
  total?: number;
  created?: number;
  errors?: BulkRegistrationError[];
  status: BulkRegistrationStatus;
}

export async function bulkRegisterSubUsers(
  file: File,
): Promise<BulkRegistrationUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post<BulkRegistrationUploadResponse>(
      API_ENDPOINTS.AUTH_SUB_USERS_BULK,
      formData,
      {
        // Let the browser set "multipart/form-data" with the correct
        // boundary instead of the instance's default JSON content-type.
        headers: { "Content-Type": undefined },
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Could not process the bulk upload."),
    );
  }
}

export async function getBulkRegistrationStatus(
  jobId: string,
): Promise<BulkRegistrationStatusResponse> {
  try {
    const response = await api.get<BulkRegistrationStatusResponse>(
      `${API_ENDPOINTS.AUTH_SUB_USERS_BULK}/${encodeURIComponent(jobId)}`,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Could not check the bulk upload status."),
    );
  }
}

export type BulkJobStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "error";

export interface BulkJobState {
  status: BulkJobStatus;
  jobId?: string;
  total?: number;
  created?: number;
  errors?: BulkRegistrationError[];
  errorMessage?: string;
  sourceHeaders?: string[];
  sourceRows?: string[][];
}

export const IDLE_BULK_JOB: BulkJobState = { status: "idle" };

export async function updateUserAccess(
  targetUserId: string,
  subUserIds: string[],
): Promise<UpdateUserAccessResponse> {
  try {
    const response = await api.patch<UpdateUserAccessResponse>(
      API_ENDPOINTS.USER_ACCESS,
      {
        target_user: targetUserId,
        sub_users: subUserIds,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Could not update sub-account access."),
    );
  }
}
