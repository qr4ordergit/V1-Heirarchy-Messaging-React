import { api } from "../api/axios";
import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { handleApiError } from "../utils/errorHandler";
import { notifications } from "@mantine/notifications";

export const getGroupTagsApi = async (groupId: string): Promise<string[]> => {
  try {
    const url = withTargetUser(
      `${API_ENDPOINTS.TAGS}?group_id=${encodeURIComponent(groupId)}`,
    );
    const response = await api.get(url);
    const data = response.data;
    return data.tag_ids || data.tags || data || [];
  } catch (error: any) {
    handleApiError(error);
    return [];
  }
};

export const createGroupTagApi = async (
  groupId: string,
  tagName: string,
): Promise<boolean> => {
  try {
    const response = await api.post(withTargetUser(API_ENDPOINTS.TAGS), {
      group_id: groupId,
      tag_name: tagName.trim(),
    });
    const data = response.data;

    if (response.status === 201 || response.status === 200 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "Tag added successfully.",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to add tag.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const deleteGroupTagApi = async (
  groupId: string,
  tagId: string,
): Promise<boolean> => {
  try {
    const response = await api.delete(withTargetUser(API_ENDPOINTS.TAGS), {
      data: {
        group_id: groupId,
        tag_id: tagId,
      },
    });
    const data = response.data;

    if (response.status === 200 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "Tag removed successfully.",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to delete tag.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

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
    const payload: Record<string, any> = {
      group_id: groupId,
      operation,
      admins: targetAdminIds,
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
