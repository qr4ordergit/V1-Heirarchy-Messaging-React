import { notifications } from "@mantine/notifications";
import { api } from "./axios";
import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { getTranslation } from "../store/language/language.store";

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
}

export interface ChatAccountsEstimate {
  usage: number;
  free_units: number;
  billable_units: number;
  unit_price: number;
  estimated_cost: number;
}

export interface StorageEstimate {
  usage_bytes: number;
  free_bytes: number;
  billable_bytes: number;
  billable_units: number;
  billing_unit_bytes: number;
  unit_price: number;
  estimated_cost: number;
}

export interface EstimateData {
  currency: string;
  chat_accounts: ChatAccountsEstimate;
  storage: StorageEstimate;
  total_estimated_cost: number;
  status?: boolean;
  [key: string]: any;
}

export interface EstimateApiResponse {
  hub_user_id: string;
  period: string;
  estimate: EstimateData;
  invoice_generated: boolean;
}

export const getEstimateApi = async (): Promise<{
  estimate: EstimateData | null;
  invoiceGenerated: boolean;
}> => {
  try {
    const endpoint = withTargetUser(API_ENDPOINTS.ESTIMATE || "/api/estimate");
    const response = await api.get(endpoint);
    const data = response.data;

    if (response.status === 200) {
      const estimate = data?.estimate || data?.body?.estimate || null;
      const invoiceGenerated = Boolean(data?.invoice_generated ?? false);
      return { estimate, invoiceGenerated };
    }
    return { estimate: null, invoiceGenerated: false };
  } catch (error) {
    console.error("Failed to load billing estimate:", error);
    return { estimate: null, invoiceGenerated: false };
  }
};

export const getUsageApi = async (): Promise<UsageData | null> => {
  try {
    const endpoint = withTargetUser(API_ENDPOINTS.USAGE || "/api/usage");
    const response = await api.get(endpoint);
    const data = response.data;

    if (response.status === 200) {
      return data?.body?.usage || data?.usage || data || null;
    }
    return null;
  } catch (error: any) {
    console.error("Failed to load usage data:", error);
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
              "plans.upgradedSuccessfully",
              "Upgraded to Paid Membership successfully!",
            )
          : getTranslation(
              "plans.membershipUpdated",
              "Membership status updated.",
            ),
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message:
        data?.message ||
        getTranslation(
          "plans.membershipUpdateFailed",
          "Failed to update membership status.",
        ),
      color: "red",
    });
    return false;
  } catch (error: any) {
    notifications.show({
      title: "",
      message:
        error.response?.data?.message ||
        getTranslation(
          "plans.membershipUpdateFailed",
          "Failed to update membership status.",
        ),
      color: "red",
    });
    return false;
  }
};
