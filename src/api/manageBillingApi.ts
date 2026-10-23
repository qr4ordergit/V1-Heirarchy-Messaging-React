import { api } from "./axios";
import { API_ENDPOINTS } from "../utils/constant";
import { handleApiError } from "../utils/errorHandler";

export interface PricingRule {
  pricing_id: string;
  pricing_type: "default" | "custom" | string;
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

export interface UserBillingEstimate {
  currency: string;
  days_accrued?: number;
  cost: {
    total: string;
    chat_accounts?: string;
    storage?: string;
  };
}

export interface UserPricingSummary {
  pricing_id: string;
  pricing_type: "default" | "custom" | string;
  version: number;
  chat_accounts?: {
    free_quantity: number;
    price_per_unit: string | number;
  };
  storage?: {
    free_bytes: number;
    price_per_gb: string | number;
  };
}

export interface UserUnpaidInfo {
  count: number;
  amount_outstanding: string;
  oldest_period: string | null;
  currency: string | null;
}

export interface AdminUserItem {
  user_id: string;
  email?: string;
  status: "active" | "deactive" | string;
  username?: string;
  pricing: UserPricingSummary;
  billing_estimate?: UserBillingEstimate;
  estimate?: UserBillingEstimate;
  last_bill_paid?: string | null;
  unpaid?: UserUnpaidInfo;
}

export interface AdminPricingOverviewDetails {
  period: string;
  default_pricing: PricingRule;
  users: {
    total: number;
    items: AdminUserItem[];
    next_cursor: string | null;
  };
  default?: {
    pricing: PricingRule;
    users: {
      total: number;
      items: AdminUserItem[];
      next_cursor: string | null;
    };
  };
  custom?: AdminUserItem[];
}

export interface AdminPricingResponse {
  message: string;
  details: AdminPricingOverviewDetails;
}

export interface OverviewQueryParams {
  limit?: number;
  cursor?: string | null;
  type?: "default" | "custom";
  status?: "active" | "deactive";
  dues?: "paid" | "unpaid";
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

export interface UserBillingOverviewDetails {
  user_id: string;
  period: string;
  available_periods: string[];
  estimate: {
    currency: string;
    days_accrued: number;
    accrued_from: string;
    accrued_through: string;
    pricing_ids: string[];
    cost: {
      chat_accounts: string;
      storage: string;
      total: string;
    };
    latest_day: {
      date: string;
      pricing: {
        pricing_id: string;
        pricing_type: string;
        version: number;
        billing_unit?: string;
      };
      chat_accounts: {
        usage: number;
        free_units: number;
        billable_units: number;
        unit_price: string;
        cost: string;
      };
      storage: {
        usage_bytes: number;
        free_bytes: number;
        unit_price: string;
        cost: string;
      };
    };
  };
  invoice_generated: boolean;
  invoice: any | null;
}

export interface UserBillingOverviewResponse {
  message: string;
  details: UserBillingOverviewDetails;
}

export type UpdatePricingPayload = DefaultPricingPayload | CustomPricingPayload;

export interface ReassignUserPayload {
  user_id: string;
  target_tier: "default" | "custom";
}

const PRICING_ENDPOINT = API_ENDPOINTS.OVERVIEW || "/admin/overview";

export const getAdminOverviewDataApi = async (
  params?: OverviewQueryParams,
): Promise<AdminPricingOverviewDetails | null> => {
  try {
    const queryParts: string[] = [];

    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    if (params?.cursor)
      queryParts.push(`cusor=${encodeURIComponent(params.cursor)}`);
    if (params?.type) queryParts.push(`type=${params.type}`);
    if (params?.status) queryParts.push(`status=${params.status}`);
    if (params?.dues) queryParts.push(`dues=${params.dues}`);

    const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";
    const res = await api.get<AdminPricingResponse>(
      `${PRICING_ENDPOINT}${queryString}`,
    );
    return res.data?.details ?? null;
  } catch (error: any) {
    handleApiError(error, "admin_billing");
    return null;
  }
};

export const getUserBillingOverviewApi = async (
  userId: string,
  period?: string,
): Promise<UserBillingOverviewDetails | null> => {
  try {
    const queryParts: string[] = [];
    if (userId) queryParts.push(`user_id=${encodeURIComponent(userId)}`);
    if (period) queryParts.push(`period=${encodeURIComponent(period)}`);

    const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";
    const res = await api.get<UserBillingOverviewResponse>(
      `${PRICING_ENDPOINT}${queryString}`,
    );
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
    await api.patch(API_ENDPOINTS.ADMIN_PRICING, payload);
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
      `${API_ENDPOINTS.ADMIN_PRICING}?user_id=${encodeURIComponent(payload.user_id)}`,
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
