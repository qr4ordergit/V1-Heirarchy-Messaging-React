import { useAuthStore } from "../store/auth/auth.store";
import { API_ENDPOINTS } from "../utils/constant";

export interface PermissionsTree {
  [key: string]: boolean | PermissionsTree;
}

export interface PermissionsResponse {
  user_id: string;
  permissions: PermissionsTree;
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchPermissions(
  userId: string,
): Promise<PermissionsResponse> {
  const response = await fetch(`${API_ENDPOINTS.PERMISSIONS}/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not load permissions.";
    throw new Error(message);
  }

  return data as PermissionsResponse;
}

export async function updatePermissions(
  userId: string,
  permissions: PermissionsTree,
): Promise<PermissionsResponse> {
  const response = await fetch(`${API_ENDPOINTS.PERMISSIONS}/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ permissions }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not update permissions.";
    throw new Error(message);
  }

  return data as PermissionsResponse;
}
