import { useAuthStore, type UserDetails } from "../store/auth/auth.store";
import { API_ENDPOINTS } from "../utils/constant";

export async function fetchUserDetails(): Promise<UserDetails> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(API_ENDPOINTS.USER_DETAILS, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    console.error("Failed to parse JSON response from user details API.");
  }

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not load user details.";
    throw new Error(message);
  }

  return data as UserDetails;
}
