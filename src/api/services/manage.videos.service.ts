import { adminApi } from "../axios";
import { ENDPOINTS } from "../endpoints";

export interface VideoRecord {
  id?: string;
  _id?: string;
  doc_type?: string;
  page_name: string;
  file: string;
  file_key?: string;
  s3_link?: string;
  order: number;
  title?: string;
  description?: string;
  upload_url?: string;
}

export interface VideoCreateInput {
  page_name: string;
  file: string;
  order: number;
  content_type: string;
}

export interface VideoUpdateInput {
  id: string;
  page_name?: string;
  order?: number;
  title?: string;
  description?: string;
  file?: string;
  content_type?: string;
}

export const getVideoId = (video: VideoRecord): string =>
  video._id ?? video.id ?? "";

export const ManageVideosService = {
  list: async (pageName?: string): Promise<VideoRecord[]> => {
    const response = await adminApi.get(ENDPOINTS.VIDEO_HANDLER.BASE, {
      params: pageName ? { page_name: pageName } : undefined,
    });
    return response.data?.videos ?? [];
  },

  create: async (videos: VideoCreateInput[]): Promise<VideoRecord[]> => {
    const response = await adminApi.post(ENDPOINTS.VIDEO_HANDLER.BASE, {
      videos,
    });
    return response.data?.videos ?? [];
  },

  update: async (
    payload: VideoUpdateInput,
  ): Promise<{ upload_url?: string; video?: VideoRecord }> => {
    const response = await adminApi.put(ENDPOINTS.VIDEO_HANDLER.BASE, payload);
    return response.data ?? {};
  },

  remove: async (id: string): Promise<void> => {
    await adminApi.delete(ENDPOINTS.VIDEO_HANDLER.BASE, {
      data: { id },
    });
  },

  arrange: async (order: Record<string, string>): Promise<void> => {
    await adminApi.post(ENDPOINTS.VIDEO_HANDLER.ARRANGE, order);
  },

  uploadToS3: (
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

      xhr.upload.onprogress = (event) => {
        if (onProgress && event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload to S3 failed (status ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload to S3 failed"));

      xhr.send(file);
    });
  },
};
