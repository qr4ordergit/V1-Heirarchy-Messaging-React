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
  } catch (error: any) {
    handleApiError(
      error,
      getTranslation(
        "billing.failedToFetchEstimate",
        "Failed to load billing estimate.",
      ),
    );
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
    handleApiError(
      error,
      getTranslation(
        "billing.failedToFetchUsage",
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
              "billing.upgradedSuccessfully",
              "Upgraded to Paid Membership successfully!",
            )
          : getTranslation(
              "billing.membershipUpdated",
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
          "billing.membershipUpdateFailed",
          "Failed to update membership status.",
        ),
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(
      error,
      getTranslation(
        "billing.membershipUpdateFailed",
        "Failed to update membership status.",
      ),
    );
    return false;
  }
};
