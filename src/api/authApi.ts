import { API_ENDPOINTS } from "../utils/constant";
import { useApiHandler } from "../hooks/useApiHandler";

export interface SignupPayload {
  email: string;
  password: string;
  group_name: string;
}

export interface SignupResponse {
  message: string;
  delivery_medium: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface UsernameSuggestResponse {
  success: boolean;
  message: string;
  suggestions: string[];
}

export interface LogoutResponse {
  message: string;
}

export function useAuthApi() {
  const api = useApiHandler();

  const signup = async (payload: SignupPayload): Promise<SignupResponse> => {
    const res = await api({
      method: "post",
      url: API_ENDPOINTS.AUTH,
      data: { operation: "signup", ...payload },
    });
    return res.data as SignupResponse;
  };

  const verifyOtp = async (
    payload: VerifyOtpPayload,
  ): Promise<VerifyOtpResponse> => {
    const res = await api({
      method: "post",
      url: API_ENDPOINTS.AUTH,
      data: { operation: "verify", ...payload },
    });
    return res.data as VerifyOtpResponse;
  };

  const suggestUsername = async (
    username: string,
  ): Promise<UsernameSuggestResponse> => {
    const res = await api({
      method: "post",
      url: API_ENDPOINTS.AUTH_USERNAME_SUGGEST,
      data: { username },
    });
    return res.data as UsernameSuggestResponse;
  };

  const logout = async (): Promise<LogoutResponse> => {
    const res = await api({
      method: "post",
      url: API_ENDPOINTS.AUTH_LOGOUT,
      showToast: false,
    });
    return res.data as LogoutResponse;
  };

  return { signup, verifyOtp, suggestUsername, logout };
}
