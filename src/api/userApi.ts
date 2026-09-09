import { AxiosError } from "axios";
import type { UserDetails } from "../store/auth/auth.store";
import { api } from "./axios";
import { API_ENDPOINTS } from "../utils/constant";

export async function fetchUserDetails(): Promise<UserDetails> {
  try {
    const response = await api.get<UserDetails>(API_ENDPOINTS.USER_DETAILS);

    return response.data;
  } catch (error) {
    const message =
      error instanceof AxiosError
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;

    throw new Error(message || "Could not load user details.");
  }
}
