import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth/auth.store";
import { ClearStore } from "../store/clear.store";
import { ROUTES } from "../router/routes";
import { API_ENDPOINTS } from "../utils/constant";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshTokenResponse {
  access_token?: string;
  id_token?: string;
}

let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function resolvePendingRequests(token: string) {
  pendingRequests.forEach(({ resolve }) => resolve(token));
  pendingRequests = [];
}

function rejectPendingRequests(error: unknown) {
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests = [];
}

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, accessToken, idToken, setTokens } =
    useAuthStore.getState();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post<RefreshTokenResponse>(
    API_ENDPOINTS.AUTH_GET_NEW_TOKEN,
    { refresh_token: refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
  );

  const newAccessToken = response.data?.access_token;
  const newIdToken = response.data?.id_token;

  if (!newAccessToken) {
    throw new Error("Refresh response did not include an access token");
  }

  setTokens({
    accessToken: newAccessToken,
    idToken: newIdToken ?? idToken ?? "",
    refreshToken,
  });

  return newAccessToken;
}

function forceLogout() {
  useAuthStore.getState().clearTokens();
  ClearStore();
  if (typeof window !== "undefined") {
    window.location.href = ROUTES.HOME;
  }
}

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isRefreshCall = originalRequest?.url?.includes("/auth/get_new_token");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();

        resolvePendingRequests(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        rejectPendingRequests(refreshError);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
