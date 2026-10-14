import { withTargetUser } from "../../utils/constant";
import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

export interface PutPayload {
  for: string;
  chat_id: string;
  keyring_category_id?: string;
  keyring_password_key?: string;
  user_key?: string;
}

export const DmGroupLockService = {
  put: async (data: PutPayload) => {
    const response = await api.put(
      withTargetUser(ENDPOINTS.DM_GROUP_LOCK.PUT),
      data,
    );
    return response.data;
  },
};
