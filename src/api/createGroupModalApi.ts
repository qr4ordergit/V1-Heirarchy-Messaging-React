import { api } from "../api/axios";
import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { handleApiError } from "../utils/errorHandler";
import { notifications } from "@mantine/notifications";

export const manageGroupMembers = async (
  groupId: string,
  targetUserIds: string[],
  operation: "add-members" | "remove-members",
): Promise<boolean> => {
  try {
    const payload = {
      group_id: groupId,
      new_members: targetUserIds,
      operation,
    };

    const response = await api.post(
      withTargetUser(API_ENDPOINTS.MANAGE_MEMBERS),
      payload,
    );
    const data = response.data;

    if (response.status !== 200 || data.success === false) {
      notifications.show({
        title: "",
        message: data.message || "Something went wrong.",
        color: "red",
      });
      return false;
    }

    notifications.show({
      title: "",
      message:
        data.message ||
        (operation === "add-members"
          ? "Member(s) added successfully."
          : "Member removed successfully."),
      color: "green",
    });
    return true;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const manageGroupAdmins = async (
  groupId: string,
  targetAdminIds: string[],
  operation: "add-members" | "remove-members",
): Promise<boolean> => {
  try {
    const payload = {
      group_id: groupId,
      admins: targetAdminIds,
      operation,
    };

    const response = await api.post(
      withTargetUser(API_ENDPOINTS.MANAGE_MEMBERS),
      payload,
    );
    const data = response.data;

    if (response.status !== 200 || data.success === false) {
      notifications.show({
        title: "",
        message: data.message || "Something went wrong.",
        color: "red",
      });
      return false;
    }

    notifications.show({
      title: "",
      message:
        data.message ||
        (operation === "add-members"
          ? "Admin(s) promoted successfully."
          : "Admin demoted successfully."),
      color: "green",
    });
    return true;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const transferGroupOwnership = async (
  groupId: string,
  newOwnerId: string,
): Promise<boolean> => {
  try {
    const payload = {
      group_id: groupId,
      operation: "change-ownership",
      new_owner: newOwnerId,
    };

    const response = await api.post(
      withTargetUser(API_ENDPOINTS.MANAGE_MEMBERS),
      payload,
    );
    const data = response.data;

    if (response.status !== 200 || data.success === false) {
      notifications.show({
        title: "",
        message: data.message || "Failed to transfer ownership.",
        color: "red",
      });
      return false;
    }

    notifications.show({
      title: "",
      message: data.message || "Ownership transferred successfully.",
      color: "green",
    });
    return true;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};
