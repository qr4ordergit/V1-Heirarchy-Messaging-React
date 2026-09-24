import { notifications } from "@mantine/notifications";
import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { api } from "./axios";
import { getTranslation } from "../store/language/language.store";

export interface UpdateProfilePayload {
  display_name?: string;
  description?: string;
  profile_picture?: string;
}

export interface ProfileUpdateResponse {
  message?: string;
  updated_fields?: string[];
  profile_picture_upload_url?: string;
}

export interface KeyringCategoryItem {
  _id?: string;
  keyring_category_id?: string;
  keyring_category_name: string;
  keyring_category_passwords: Record<string, string>;
  [key: string]: any;
}

export interface CreateKeyringCategoryPayload {
  keyring_category_name: string;
  keyring_category_passwords: Record<string, string>;
}

export interface UpdateKeyringCategoryPayload {
  keyring_category_id: string;
  keyring_category_name: string;
  keyring_category_passwords: Record<string, string>;
}

const showNotification = (message: string) => {
  notifications.show({
    title: "",
    message,
    color: "red",
  });
};

export const getTagsApi = async (): Promise<string[]> => {
  const response = await api.get(withTargetUser(API_ENDPOINTS.TAGS));

  if (response.status !== 200) {
    showNotification(
      response.data?.message ||
        getTranslation(
          "profile.notificationFailedFetchTagList",
          "Failed to fetch tags list.",
        ),
    );
    return [];
  }

  return response.data.tag_ids || [];
};

export const createTagApi = async (tagName: string): Promise<any | null> => {
  const response = await api.post(withTargetUser(API_ENDPOINTS.TAGS), {
    tag_name: tagName.trim(),
  });

  const data = response.data;
  if (response.status !== 201 || data.success === false) {
    showNotification(
      data?.message ||
        getTranslation(
          "profile.notificationFailedToCreateTag",
          "Failed to create tag.",
        ),
    );
    return null;
  }

  return data;
};

export const deleteTagApi = async (tagId: string): Promise<any | null> => {
  const response = await api.delete(withTargetUser(API_ENDPOINTS.TAGS), {
    data: {
      tag_id: tagId,
    },
  });

  const data = response.data;
  if (response.status !== 200 || data.success === false) {
    showNotification(
      data?.message ||
        getTranslation(
          "profile.notificationFailedToDeleteTag",
          "Failed to delete tag.",
        ),
    );
    return null;
  }

  return data;
};

export const updateProfileApi = async (
  payload: UpdateProfilePayload,
): Promise<ProfileUpdateResponse | null> => {
  const response = await api.patch(
    withTargetUser(API_ENDPOINTS.USER_HOME),
    payload,
  );

  const data = response.data;
  if (response.status !== 200 || data.success === false) {
    showNotification(
      data?.message ||
        getTranslation(
          "profile.notificationFailedToUpdateProfile",
          "Failed to initiate profile update.",
        ),
    );
    return null;
  }

  return data;
};

export const uploadImageToS3Api = async (
  presignedUrl: string,
  file: File,
): Promise<boolean> => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "image/png",
    },
    body: file,
  });

  if (!response.ok) {
    showNotification(
      getTranslation(
        "profile.notificationFailedToUploadImg",
        "Failed to upload image file to storage.",
      ),
    );
    return false;
  }

  return true;
};

export const getKeyringCategoriesApi = async (
  keyringCategoryId?: string,
): Promise<KeyringCategoryItem[]> => {
  try {
    let url = API_ENDPOINTS.KEYRING_CATEGORIES;
    if (keyringCategoryId) {
      url += `?keyring_category_id=${encodeURIComponent(keyringCategoryId)}`;
    }
    const response = await api.get(withTargetUser(url));
    const data = response.data;
    if (response.status === 200) {
      return data.categories || data.data || (Array.isArray(data) ? data : []);
    }
    return [];
  } catch (error: any) {
    showNotification(
      error?.response?.data?.message ||
        getTranslation(
          "profile.failedToFetchKeyring",
          "Failed to fetch keyring categories.",
        ),
    );
    return [];
  }
};

export const createKeyringCategoryApi = async (
  payload: CreateKeyringCategoryPayload,
): Promise<any | null> => {
  try {
    const response = await api.post(
      withTargetUser(API_ENDPOINTS.KEYRING_CATEGORIES),
      payload,
    );
    const data = response.data;
    if (
      response.status === 201 ||
      response.status === 200 ||
      data?.success !== false
    ) {
      return data;
    }
    showNotification(
      data?.message ||
        getTranslation(
          "profile.failedToCreateKeyring",
          "Failed to create keyring category.",
        ),
    );
    return null;
  } catch (error: any) {
    showNotification(
      error?.response?.data?.message ||
        getTranslation(
          "profile.failedToCreateKeyring",
          "Failed to create keyring category.",
        ),
    );
    return null;
  }
};

export const updateKeyringCategoryApi = async (
  payload: UpdateKeyringCategoryPayload,
): Promise<boolean> => {
  try {
    const response = await api.put(
      withTargetUser(API_ENDPOINTS.KEYRING_CATEGORIES),
      payload,
    );
    const data = response.data;
    if (response.status === 200 || data?.success !== false) {
      return true;
    }
    showNotification(
      data?.message ||
        getTranslation(
          "profile.failedToUpdateKeyring",
          "Failed to update keyring category.",
        ),
    );
    return false;
  } catch (error: any) {
    showNotification(
      error?.response?.data?.message ||
        getTranslation(
          "profile.failedToUpdateKeyring",
          "Failed to update keyring category.",
        ),
    );
    return false;
  }
};

export const deleteKeyringCategoryApi = async (
  keyringCategoryId: string,
): Promise<boolean> => {
  try {
    const url = `${API_ENDPOINTS.KEYRING_CATEGORIES}?keyring_category_id=${encodeURIComponent(
      keyringCategoryId,
    )}`;
    const response = await api.delete(withTargetUser(url));
    const data = response.data;
    if (
      response.status === 200 ||
      response.status === 204 ||
      data?.success !== false
    ) {
      return true;
    }
    showNotification(
      data?.message ||
        getTranslation(
          "profile.failedToDeleteKeyring",
          "Failed to delete keyring category.",
        ),
    );
    return false;
  } catch (error: any) {
    showNotification(
      error?.response?.data?.message ||
        getTranslation(
          "profile.failedToDeleteKeyring",
          "Failed to delete keyring category.",
        ),
    );
    return false;
  }
};
