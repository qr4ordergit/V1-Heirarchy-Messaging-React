import { API_ENDPOINTS, withTargetUser } from "../utils/constant";
import { api } from "./axios";

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

export const getAdjacencyListApi = async (): Promise<string[]> => {
  const response = await api.get(withTargetUser(API_ENDPOINTS.ADJACENCY_LIST));

  if (response.status !== 200) {
    throw new Error(response.data.message || "Failed to fetch accounts list.");
  }

  return response.data.adjacencylist || response.data || [];
};

export const getTagsApi = async (): Promise<string[]> => {
  const response = await api.get(withTargetUser(API_ENDPOINTS.TAGS));

  if (response.status !== 200) {
    throw new Error(response.data.message || "Failed to fetch tags list.");
  }

  return response.data.tag_ids || [];
};

export const createTagApi = async (tagName: string): Promise<any> => {
  const response = await api.post(withTargetUser(API_ENDPOINTS.TAGS), {
    tag_name: tagName.trim(),
  });

  const data = response.data;
  if (response.status !== 201 || data.success === false) {
    throw new Error(data.message || "Failed to create tag.");
  }

  return data;
};

export const deleteTagApi = async (tagId: string): Promise<any> => {
  const response = await api.delete(withTargetUser(API_ENDPOINTS.TAGS), {
    data: {
      tag_id: tagId,
    },
  });

  const data = response.data;

  if (response.status !== 200 || data.success === false) {
    throw new Error(data.message || "Failed to delete tag.");
  }

  return data;
};

export const updateProfileApi = async (
  payload: UpdateProfilePayload,
): Promise<ProfileUpdateResponse> => {
  const response = await api.patch(
    withTargetUser(API_ENDPOINTS.USER_HOME),
    payload,
  );

  const data = response.data;

  if (response.status !== 200 || data.success === false) {
    throw new Error(data.message || "Failed to initiate profile update.");
  }

  return data;
};

export const uploadImageToS3Api = async (
  presignedUrl: string,
  file: File,
): Promise<void> => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "image/png",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image file to storage.");
  }
};
