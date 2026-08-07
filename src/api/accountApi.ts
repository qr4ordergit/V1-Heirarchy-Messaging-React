import { useAuthStore } from "../store/auth/auth.store";
import { API_ENDPOINTS } from "../utils/constant";

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Account {
  user_id: string;
  display_name: string | null;
  email: string | null;
  profile_picture: string | null;
  status: string | null;
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
}

export interface DeleteAccountResponse {
  message: string;
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
    body.phone = payload.phone;
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
