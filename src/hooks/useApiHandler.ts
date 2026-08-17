import axios, { type Method } from "axios";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/auth/auth.store";
import { ROUTES } from "../router/routes";

interface ApiRequest {
  method: Extract<Method, "get" | "post" | "put" | "patch" | "delete">;
  url: string;
  data?: unknown;
  showToast?: boolean;
}

export function useApiHandler() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const accessToken = useAuthStore((state) => state.accessToken);

  return async ({ method, url, data, showToast = true }: ApiRequest) => {
    try {
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined;

      return await axios({ method, url, data, headers });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Something went wrong.";

      if (showToast) {
        notifications.show({ color: "red", title: "Request failed", message });
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearTokens();
        navigate(ROUTES.HOME);
      }

      throw error;
    }
  };
}
