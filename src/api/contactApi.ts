import { api } from "../api/axios";
import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { handleApiError } from "../utils/errorHandler";
import { encryptPasskey } from "../utils/passkeyCipher";
import { notifications } from "@mantine/notifications";
import type {
  Contact,
  ContactFormValues,
  GroupItem,
} from "../pages/contact/Contact";

export interface InviteInformation {
  status: string;
  resource_information: {
    resource_id: string;
    name: string;
    resource_type: string;
  };
  remaining_uses: number;
  expires_at: string;
}

export const getPendingInviteApi = async (
  inviteCode: string,
): Promise<InviteInformation | null> => {
  try {
    const url = withTargetUser(
      `${API_ENDPOINTS.CREATE_INVITE_LINK}/${encodeURIComponent(inviteCode)}`,
    );
    const response = await api.get(url);
    const data = response.data;

    if (
      response.status === 200 &&
      (data.status === "VALID" || data.resource_information)
    ) {
      return data;
    }
    return null;
  } catch (error: any) {
    return null;
  }
};

export const acceptInviteApi = async (
  inviteCode: string,
  currentUsername: string,
): Promise<boolean> => {
  try {
    const url = withTargetUser(
      `${API_ENDPOINTS.CREATE_INVITE_LINK}/${encodeURIComponent(inviteCode)}`,
    );
    const response = await api.post(url, { user_id: currentUsername });
    const data = response.data;

    if (response.status === 200 || response.status === 201 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "Group invite accepted successfully!",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to accept invite.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const rejectInviteApi = async (inviteCode: string): Promise<boolean> => {
  try {
    const url = withTargetUser(
      `${API_ENDPOINTS.CREATE_INVITE_LINK}/${encodeURIComponent(inviteCode)}`,
    );
    const response = await api.delete(url);
    const data = response.data;

    if (response.status === 200 || response.status === 204 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "Invite rejected.",
        color: "blue",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to reject invite.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const getContactsApi = async (): Promise<Contact[] | null> => {
  try {
    const response = await api.get(withTargetUser(API_ENDPOINTS.CONTACTS));
    if (response.status === 200) {
      const data = response.data;
      return (data.contacts || data || []).map((item: any, index: number) => ({
        id: item._id || String(index),
        username: item.contact_user_id || item.username || "",
        name: item.display_name || item.name || "Unknown",
        phone: item.phone || "",
        email: item.email || "",
        color: item.color || "indigo",
      }));
    }
    notifications.show({
      title: "",
      message: "Failed to fetch contacts.",
      color: "red",
    });
    return null;
  } catch (error: any) {
    handleApiError(error);
    return null;
  }
};

export const getGroupsApi = async (): Promise<GroupItem[] | null> => {
  try {
    const endpoint = withTargetUser(API_ENDPOINTS.CREATE_GROUP);
    const response = await api.get(endpoint);
    if (response.status === 200) {
      return response.data.data || [];
    }
    notifications.show({
      title: "",
      message: "Failed to fetch groups.",
      color: "red",
    });
    return null;
  } catch (error: any) {
    handleApiError(error);
    return null;
  }
};

export const getContactDetailsApi = async (
  contactUserId: string,
): Promise<any | null> => {
  try {
    const getUrl = `${API_ENDPOINTS.CONTACTS}/${contactUserId}`;
    const response = await api.get(withTargetUser(getUrl));
    const data = response.data;
    if ((response.status === 200 || data.success) && data.contact) {
      return data.contact;
    }
    notifications.show({
      title: "",
      message: data.message || "Failed to fetch contact details.",
      color: "red",
    });
    return null;
  } catch (error: any) {
    handleApiError(error);
    return null;
  }
};

export const saveContactApi = async (
  values: ContactFormValues,
  passNeeded: boolean,
  isEdit: boolean,
  currentUsername: string,
): Promise<boolean> => {
  const contactUserId = values.username.split("#")[1] || values.username.trim();

  try {
    const contactData = {
      owner_user_id: currentUsername,
      contact_user_id: contactUserId,
      display_name: values.name.trim(),
      phone: values.phone,
      email: values.email,
    };

    let payload: any = isEdit ? contactData : { contact_data: contactData };

    if (!isEdit && passNeeded && values.passKey?.trim()) {
      payload.pass = await encryptPasskey(values.passKey.trim(), contactUserId);
    }

    const response = await api.request({
      url: withTargetUser(API_ENDPOINTS.CONTACTS),
      method: isEdit ? "PUT" : "POST",
      data: JSON.stringify(payload),
    });

    const data = response.data;
    if (data.success || response.status === 200 || response.status === 201) {
      notifications.show({
        title: "",
        message:
          data.message ||
          `Contact ${isEdit ? "updated" : "added"} successfully`,
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message:
        data.message || `Failed to ${isEdit ? "update" : "add"} contact.`,
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const deleteContactApi = async (
  contactUserId: string,
  currentUsername: string,
): Promise<boolean> => {
  try {
    const payload = {
      owner_user_id: currentUsername,
      contact_user_id: contactUserId,
    };

    const response = await api.request({
      url: withTargetUser(API_ENDPOINTS.CONTACTS),
      method: "DELETE",
      data: JSON.stringify(payload),
    });

    const data = response.data;
    if (data.success || response.status === 200 || response.status === 201) {
      notifications.show({
        title: "",
        message: data.message || "Contact deleted successfully",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to delete contact.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const deleteGroupApi = async (groupId: string): Promise<boolean> => {
  try {
    const deleteUrl = `${API_ENDPOINTS.CREATE_GROUP}?group_id=${encodeURIComponent(groupId)}`;
    const response = await api.delete(withTargetUser(deleteUrl));
    const data = response.data;

    if (response.status === 200 || response.status === 201 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "Group deleted successfully",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to delete group",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const leaveGroupApi = async (groupId: string): Promise<boolean> => {
  try {
    const payload = {
      group_id: groupId,
      operation: "remove-members",
    };

    const response = await api.post(
      withTargetUser(API_ENDPOINTS.MANAGE_MEMBERS),
      payload,
    );
    const data = response.data;

    if (response.status === 200 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "You have left the group.",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to leave group.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const startConversationApi = async (
  targetUserId: string,
): Promise<boolean> => {
  try {
    const endpoint = withTargetUser(API_ENDPOINTS.START_CONVERSATION);
    const response = await api.post(endpoint, { user_id: targetUserId });
    const data = response.data;

    if (response.status === 201 || data.success) {
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to start conversation.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};

export const copyToClipboardSafely = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && document.hasFocus()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    textarea.style.top = "-999999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
};

export const createInviteLinkApi = async (
  groupId: string,
  createdBy: string,
): Promise<string | null> => {
  try {
    const payload = {
      resource_id: groupId,
      resource_type: "group",
      created_by: createdBy,
      expiry_hours: 24,
      max_uses: 10,
    };

    const response = await api.post(
      withTargetUser(API_ENDPOINTS.CREATE_INVITE_LINK),
      payload,
    );
    const data = response.data;
    return data.invite_code || data.url || data.invite_url || null;
  } catch (error: any) {
    handleApiError(error);
    return null;
  }
};

export const saveGroupPayloadApi = async (
  payload: Record<string, any>,
  isEdit: boolean,
  groupId?: string,
): Promise<boolean> => {
  const { group_image_file, ...apiPayload } = payload;

  try {
    const endpoint = withTargetUser(API_ENDPOINTS.CREATE_GROUP);
    const finalBody =
      isEdit && groupId ? { ...apiPayload, group_id: groupId } : apiPayload;

    const response = await api.request({
      url: endpoint,
      method: isEdit ? "PUT" : "POST",
      data: finalBody,
    });

    const data = response.data;

    if (response.status === 201 || response.status === 200 || data.success) {
      const presignedUrl = data.upload_url || data.group?.upload_url;
      if (presignedUrl && group_image_file) {
        try {
          await fetch(presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": group_image_file.type || "image/png",
            },
            body: group_image_file,
          });
        } catch (error: any) {
          handleApiError(error);
        }
      }

      notifications.show({
        title: "",
        message:
          data.message ||
          `Group ${isEdit ? "updated" : "created"} successfully!`,
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message:
        data.message || `Failed to ${isEdit ? "update" : "create"} group.`,
      color: "red",
    });
    return false;
  } catch (error: any) {
    handleApiError(error);
    return false;
  }
};
