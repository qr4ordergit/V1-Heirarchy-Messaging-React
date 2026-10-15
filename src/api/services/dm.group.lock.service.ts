import { withTargetUser } from "../../utils/constant";
import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

export interface LockPayload {
  for: string;
  chat_id: string;
  keyring_category_id?: string;
  keyring_password_key?: string;
  user_key?: string;
}

export interface UnlockPayload {
  for: string;
  chat_id: string;
}

export const DmGroupLockService = {
  lock: async (data: LockPayload) => {
    const response = await api.put(
      withTargetUser(ENDPOINTS.DM_GROUP_LOCK.PUT),
      data,
    );
    return response.data;
  },
  unlock: async ({ for: target, chat_id }: UnlockPayload) => {
    const response = await api.delete(
      withTargetUser(ENDPOINTS.DM_GROUP_LOCK.DELETE),
      {
        params: {
          for: target,
          chat_id: chat_id,
        },
      },
    );
    return response.data;
  },
};
