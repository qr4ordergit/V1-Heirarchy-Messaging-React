import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { createElement } from "react";
import { api } from "./axios";
import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { getTranslation } from "../store/language/language.store";
import { handleApiError } from "../utils/errorHandler";

export interface UpdateMembershipPayload {
  is_paid: boolean;
}

export interface StorageBytes {
  dm_bytes: number;
  group_bytes: number;
  s3_bytes: number;
  total_bytes: number;
}

export interface UsageData {
  chat_accounts?: number;
  premium_usernames?: number;
  account_tags?: number;
  storage_bytes?: StorageBytes;
  snapshot_date?: string;
  [key: string]: any;
}

export interface UsageApiResponse {
  body?: {
    hub_user_id: string;
    period: string;
    usage: UsageData;
  };
  usage?: UsageData;
  [key: string]: any;
}

export interface ChatAccountsEstimate {
  usage?: number;
  free_units?: number;
  billable_units?: number;
  unit_price?: number;
  estimated_cost?: number;
}

export interface StorageEstimate {
  usage_bytes?: number;
  free_bytes?: number;
  billable_bytes?: number;
  billable_units?: number;
  billing_unit_bytes?: number;
  unit_price?: number;
  estimated_cost?: number;
}

export interface LatestDayMetrics {
  usage?: number;
  free_units?: number;
  billable_units?: number;
  usage_bytes?: number;
  free_bytes?: number;
  unit_price: string | number;
  cost: string | number;
}

export interface EstimateData {
  currency?: string;
  days_accrued?: number;
  accrued_from?: string;
  accrued_through?: string;
  pricing_ids?: string[];
  cost?: {
    chat_accounts?: string | number;
    storage?: string | number;
    total?: string | number;
  };
  latest_day?: {
    date?: string;
    pricing?: {
      pricing_id?: string;
      pricing_type?: string;
      billing_unit?: string;
    };
    chat_accounts?: LatestDayMetrics;
    storage?: LatestDayMetrics;
  };
  total_chat_accounts_cost?: string | number;
  total_storage_cost?: string | number;
  total_estimated_cost?: string | number;
  chat_accounts?: any;
  storage?: any;
  [key: string]: any;
}

export interface EstimateApiResponse {
  hub_user_id: string;
  period: string;
  available_periods: string[];
  snapshot_date?: string;
  estimate: EstimateData;
  invoice_generated?: boolean;
  invoice?: any | null;
  [key: string]: any;
}
export interface UserBillingMonthlyResponse {
  message: string;
  details: {
    user_id: string;
    period: string;
    estimate: EstimateData;
    invoice_generated: boolean;
    invoice: any | null;
  };
}
export interface InvoicePdfDetails {
  url: string;
  expires_in?: number;
}

export interface InvoiceItem {
  invoice_id: string;
  period: string;
  status: "pending" | "paid" | string;
  currency: string;
  days_accrued: number;
  accrued_from: string;
  accrued_through: string;
  issued_at: string;
  due_at: string;
  cost: {
    chat_accounts: string;
    storage: string;
  };
  total_due: string;
  amount_paid: string;
  amount_outstanding: string;
  pdf?: InvoicePdfDetails | null;
}

export interface InvoicesApiResponse {
  hub_user_id: string;
  count: number;
  total_outstanding: Record<string, string>;
  invoices: InvoiceItem[];
}

export const getUserInvoicesApi =
  async (): Promise<InvoicesApiResponse | null> => {
    try {
      const endpoint = withTargetUser(
        API_ENDPOINTS.INVOICES || "/api/invoices",
      );
      const response = await api.get<InvoicesApiResponse>(endpoint);
      return response.status === 200 ? response.data : null;
    } catch (error: any) {
      handleApiError(error, "account_billing");
      return null;
    }
  };

export const downloadInvoicePdfApi = async (
  period: string,
): Promise<{ download_url?: string; url?: string; error?: string } | null> => {
  try {
    const rawEndpoint = withTargetUser(
      API_ENDPOINTS.INVOICES || "/api/invoices",
    );
    const separator = rawEndpoint.includes("?") ? "&" : "?";
    const endpoint = `${rawEndpoint}${separator}period=${encodeURIComponent(period)}`;

    const response = await api.get(endpoint);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      return error.response.data;
    }
    handleApiError(error, "account_billing");
    return null;
  }
};

export const getUserBillingMonthlyApi = async (
  userId: string,
  period: string,
): Promise<UserBillingMonthlyResponse["details"] | null> => {
  try {
    const response = await api.get<UserBillingMonthlyResponse>(
      `${API_ENDPOINTS.ESTIMATE}?user_id=${encodeURIComponent(userId)}&period=${encodeURIComponent(period)}`,
    );
    return response.data?.details ?? null;
  } catch (error: any) {
    handleApiError(error, "account_billing");
    return null;
  }
};

const appendPeriodParam = (baseEndpoint: string, period?: string): string => {
  if (!period) return baseEndpoint;
  const separator = baseEndpoint.includes("?") ? "&" : "?";
  return `${baseEndpoint}${separator}period=${encodeURIComponent(period)}`;
};

export const getEstimateApi = async (): Promise<{
  estimate: EstimateData | null;
  invoiceGenerated: boolean;
  period?: string;
  availablePeriods: string[];
}> => {
  try {
    const rawEndpoint = withTargetUser(
      API_ENDPOINTS.ESTIMATE || "/api/estimate",
    );
    const endpoint = appendPeriodParam(rawEndpoint);
    const response = await api.get(endpoint);
    const data = response.data;

    if (response.status === 200) {
      const estimate = data?.estimate || data?.body?.estimate || null;
      const invoiceGenerated = Boolean(
        data?.invoice_generated ?? data?.body?.invoice_generated ?? false,
      );
      const resPeriod = data?.period || data?.body?.period;
      const availablePeriods: string[] =
        data?.available_periods || (data as any)?.body?.available_periods || [];

      return {
        estimate,
        invoiceGenerated,
        period: resPeriod,
        availablePeriods,
      };
    }
    return { estimate: null, invoiceGenerated: false, availablePeriods: [] };
  } catch (error: any) {
    handleApiError(
      error,
      getTranslation(
        "account_billing.failedToFetchEstimate",
        "Failed to load billing estimate.",
      ),
    );
    return { estimate: null, invoiceGenerated: false, availablePeriods: [] };
  }
};

export const getUsageApi = async (): Promise<UsageData | null> => {
  try {
    const rawEndpoint = withTargetUser(API_ENDPOINTS.USAGE || "/api/usage");
    const endpoint = appendPeriodParam(rawEndpoint);
    const response = await api.get(endpoint);
    const data = response.data;

    if (response.status === 200) {
      return data?.body?.usage || data?.usage || data || null;
    }
    return null;
  } catch (error: any) {
    handleApiError(
      error,
      getTranslation(
        "account_billing.failedToFetchUsage",
        "Failed to load usage data.",
      ),
    );
    return null;
  }
};

export const updateMembershipStatusApi = async (
  isPaid: boolean,
): Promise<boolean> => {
  try {
    const endpoint = withTargetUser(API_ENDPOINTS.USER_HOME);
    const response = await api.patch(endpoint, {
      is_paid: isPaid,
    });

    const data = response.data;
    if (response.status === 200 || data?.success) {
      notifications.show({
        title: "",
        message: isPaid
          ? getTranslation(
              "account_billing.upgradedSuccessfully",
              "Upgraded to Paid Membership successfully!",
            )
          : getTranslation(
              "account_billing.membershipUpdated",
              "Membership status updated.",
            ),
        color: "green",
        icon: createElement(IconCheck, { size: 18 }),
      });
      return true;
    }

    notifications.show({
      title: "",
      message:
        data?.message ||
        getTranslation(
          "account_billing.membershipUpdateFailed",
          "Failed to update membership status.",
        ),
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(
      error,
      getTranslation(
        "account_billing.membershipUpdateFailed",
        "Failed to update membership status.",
      ),
    );
    return false;
  }
};
