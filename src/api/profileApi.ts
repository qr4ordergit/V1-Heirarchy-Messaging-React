import { API_ENDPOINTS, getHeaders, withTargetUser } from "../utils/constant";

export interface TagItem {
  tag_id?: string;
  tag_name?: string;
  id?: string;
  name?: string;
  _id?: string;
}

export interface UpdateProfilePayload {
  display_name: string;
  profile_picture: string;
}

export interface ProfileUpdateResponse {
  message?: string;
  updated_fields?: string[];
  profile_picture_upload_url?: string;
}

export const getAdjacencyListApi = async (): Promise<string[]> => {
  const response = await fetch(withTargetUser(API_ENDPOINTS.ADJACENCY_LIST), {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch accounts list.");
  }

  return data.adjacencylist || data.data || [];
};

export const getTagsApi = async (): Promise<TagItem[]> => {
  const response = await fetch(withTargetUser(API_ENDPOINTS.TAGS), {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tags list.");
  }

  return data.tags || data.data || (Array.isArray(data) ? data : []);
};


export const createTagApi = async (tagName: string): Promise<any> => {
  const response = await fetch(withTargetUser(API_ENDPOINTS.TAGS), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ tag_name: tagName.trim() }),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Failed to create tag.");
  }

  return data;
};

export const deleteTagApi = async (tagId: string): Promise<any> => {
  const response = await fetch(withTargetUser(API_ENDPOINTS.TAGS), {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify({ tag_id: tagId }),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Failed to delete tag.");
  }

  return data;
};

export const updateProfileApi = async (
  payload: UpdateProfilePayload,
): Promise<ProfileUpdateResponse> => {
  const response = await fetch(withTargetUser(API_ENDPOINTS.USER_HOME), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
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