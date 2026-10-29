import axios from "axios";
import { useAuthStore } from "../store/auth/auth.store";
import { API_ENDPOINTS } from "../utils/constant";

export interface ActiveSession {
  id: string;
  device_name?: string;
  platform?: string;
  browser?: string;
  created_at?: string;
  is_current?: boolean;
}

export type RegisterSessionResult =
  | { status: "ok" }
  | { status: "active_count"; message: string; sessions: ActiveSession[] };

interface RawDevice {
  _id?: string;
  device_name?: string;
  platform?: string;
  browser?: string;
  created_at?: string | { $date?: string };
  revoked_at?: unknown;
  is_current?: boolean;
  current?: boolean;
}

interface UserSessionBody {
  success?: boolean;
  error?: string;
  message?: string;
  active_count?: number;
  max_limit?: number;
  active_devices?: RawDevice[];
  Device_List?: RawDevice[];
}

async function detectBrave(): Promise<boolean> {
  try {
    const nav = navigator as Navigator & {
      brave?: { isBrave?: () => Promise<boolean> };
    };
    return !!(await nav.brave?.isBrave?.());
  } catch {
    return false;
  }
}

export async function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isBrave = await detectBrave();

  const platform = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iOS"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown";

  const browser = isBrave
    ? "Brave"
    : /Edg\//i.test(ua)
      ? "Edge"
      : /OPR\//i.test(ua)
        ? "Opera"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : /Chrome\//i.test(ua)
            ? "Chrome"
            : /Safari\//i.test(ua)
              ? "Safari"
              : "Unknown";

  return { platform, browser, device_name: `${browser} on ${platform}` };
}

function normalizeDevices(list: RawDevice[] | undefined): ActiveSession[] {
  return (list ?? [])
    .filter((d) => d._id && !d.revoked_at)
    .map((d) => ({
      id: d._id as string,
      device_name: d.device_name,
      platform: d.platform,
      browser: d.browser,
      created_at:
        typeof d.created_at === "string" ? d.created_at : d.created_at?.$date,
      is_current: d.is_current ?? d.current,
    }));
}

function isLimitBody(data: UserSessionBody | undefined): boolean {
  return (
    data?.success === false &&
    (Array.isArray(data.Device_List) || Array.isArray(data.active_devices))
  );
}

function toLimitResult(data: UserSessionBody): RegisterSessionResult {
  return {
    status: "active_count",
    message:
      data.error ||
      data.message ||
      "Maximum device limit reached. Please log out from another device.",
    sessions: normalizeDevices(data.Device_List ?? data.active_devices),
  };
}

export async function registerSession(
  accessToken: string,
  refreshToken: string,
): Promise<RegisterSessionResult> {
  const { platform, browser, device_name } = await getDeviceInfo();

  try {
    const response = await axios.post<UserSessionBody>(
      API_ENDPOINTS.AUTH_USER_SESSION,
      {
        refresh_token: refreshToken,
        platform,
        browser,
        device_name,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (response.data && isLimitBody(response.data)) {
      return toLimitResult(response.data);
    }
    if (response.data?.success === false) {
      throw new Error(response.data.error || "Could not verify this device.");
    }
    return { status: "ok" };
  } catch (error) {
    if (axios.isAxiosError<UserSessionBody>(error)) {
      const data = error.response?.data;
      if (data && isLimitBody(data)) return toLimitResult(data);
      throw new Error(
        data?.error ||
          data?.message ||
          "Could not verify this device. Please try again.",
      );
    }
    throw error;
  }
}

export async function revokeSession(id: string): Promise<void> {
  const { accessToken } = useAuthStore.getState();

  const response = await axios.post<UserSessionBody>(
    API_ENDPOINTS.AUTH_USER_SESSION,
    { session_id: id },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken ?? ""}`,
      },
    },
  );

  if (response.data?.success === false && !isLimitBody(response.data)) {
    throw new Error(response.data.error || "Could not log out that device.");
  }
}

export async function revokeAllSessions(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => revokeSession(id)));
}

export async function fetchSessions(): Promise<ActiveSession[]> {
  const { accessToken } = useAuthStore.getState();

  const response = await axios.get<UserSessionBody>(
    API_ENDPOINTS.AUTH_USER_SESSION,
    { headers: { Authorization: `Bearer ${accessToken ?? ""}` } },
  );

  if (response.data?.success === false && !isLimitBody(response.data)) {
    throw new Error(response.data.error || "Could not load devices.");
  }
  return normalizeDevices(
    response.data?.Device_List ?? response.data?.active_devices,
  );
}
