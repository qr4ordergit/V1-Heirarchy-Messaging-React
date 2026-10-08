import { api } from "./axios";
import { API_ENDPOINTS } from "../utils/constant";
import { handleApiError } from "../utils/errorHandler";

export interface PricingRule {
  pricing_id: string;
  pricing_type: string;
  version: number;
  status: string;
  currency: string;
  chat_accounts: {
    free_quantity: number;
    price_per_unit: string | number;
  };
  storage: {
    free_bytes: number;
    price_per_gb: string | number;
  };
  effective_from: string | null;
  effective_until: string | null;
  updated_at: string;
}

export interface UserEstimateCost {
  chat_accounts: string;
  storage: string;
  total: string;
}

export interface UserEstimateUsage {
  chat_accounts: number;
  premium_usernames: number;
  account_tags: number;
  storage_bytes: number;
}

export interface UserEstimate {
  snapshot_date: string;
  usage: UserEstimateUsage;
  pricing: {
    pricing_id: string;
    pricing_type: string;
    currency: string;
  };
  cost: UserEstimateCost;
}

export interface AdminUserItem {
  user_id: string;
  email?: string;
  status: "active" | "deactive" | string;
  username?: string;
  estimate?: UserEstimate;
}

export interface DefaultTierGroup {
  pricing: PricingRule;
  users: {
    total: number;
    items: AdminUserItem[];
    next_cursor: string | null;
  };
}

export interface CustomTierItem extends AdminUserItem {
  pricing: PricingRule;
}

export interface AdminPricingResponse {
  message: string;
  details: {
    default: DefaultTierGroup;
    custom: CustomTierItem[];
  };
}

export interface DefaultPricingPayload {
  pricing_type: "default";
  currency: string;
  change_reason: string;
  expected_version: number;
  chat_accounts: {
    free_quantity: number;
    price_per_unit: string;
  };
  storage: {
    free_bytes: number;
    price_per_gb: string;
  };
}

export interface CustomPricingPayload {
  pricing_type: "custom";
  user_id: string;
  currency: string;
  change_reason: string;
  expected_version: number;
  chat_accounts: {
    free_quantity: number;
    price_per_unit: string;
  };
  storage: {
    free_bytes: number;
    price_per_gb: string;
  };
}

export type UpdatePricingPayload = DefaultPricingPayload | CustomPricingPayload;

export interface ReassignUserPayload {
  user_id: string;
  target_tier: "default" | "custom";
}

const PRICING_ENDPOINT = API_ENDPOINTS.ADMIN_PRICING || "/admin/pricing";

export const getAdminPricingDataApi = async (): Promise<
  AdminPricingResponse["details"] | null
> => {
  try {
    const res = await api.get<AdminPricingResponse>(PRICING_ENDPOINT);
    return res.data?.details ?? null;
  } catch (error: any) {
    handleApiError(error, "admin_billing");
    return null;
  }
};

export const patchPricingTierRatesApi = async (
  payload: UpdatePricingPayload,
): Promise<boolean> => {
  try {
    await api.patch(PRICING_ENDPOINT, payload);
    return true;
  } catch (error: any) {
    handleApiError(error, "admin_billing");
    return false;
  }
};

export const reassignUserTierApi = async (
  payload: ReassignUserPayload,
): Promise<boolean> => {
  try {
    const response = await api.delete(
      `${PRICING_ENDPOINT}?user_id=${encodeURIComponent(payload.user_id)}`,
    );
    return response.status === 200;
  } catch (error: any) {
    handleApiError(error, "admin_billing");
    return false;
  }
};

export const activateUserApi = async (hubUserId: string): Promise<boolean> => {
  try {
    const response = await api.patch(
      `${API_ENDPOINTS.ACTIVATE_USER}?hub=${encodeURIComponent(hubUserId)}`,
    );
    return response.status === 200;
  } catch (error: any) {
    handleApiError(error, "admin_billing");
    return false;
  }
};

export const deactivateUserApi = async (
  hubUserId: string,
): Promise<boolean> => {
  try {
    const response = await api.patch(
      `${API_ENDPOINTS.DEACTIVATE_USER}?hub=${encodeURIComponent(hubUserId)}`,
    );
    return response.status === 200;
  } catch (error: any) {
    handleApiError(error, "admin_billing");
    return false;
  }
};

export const toggleUserStatusApi = async (
  hubUserId: string,
  targetStatus: "active" | "deactive",
): Promise<boolean> => {
  if (targetStatus === "active") {
    return activateUserApi(hubUserId);
  } else {
    return deactivateUserApi(hubUserId);
  }
};
