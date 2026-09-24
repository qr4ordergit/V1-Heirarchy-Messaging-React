import { notifications } from "@mantine/notifications";
import { api } from "./axios";
import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { getTranslation } from "../store/language/language.store";

export interface UpdateMembershipPayload {
  is_paid: boolean;
}

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
