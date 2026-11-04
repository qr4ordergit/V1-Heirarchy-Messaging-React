import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

interface PutPaylodProps {
    keyring_category_id : string[]; 
    username : string
}

export const ShareKeyringCategoryService = {
  keyringCategories: async (tu: string) => {
    const response = await api.get(
      `${ENDPOINTS.SHARE_KEYRING_CATEGORY.LIST}?target_user=${tu}`,
    );
    return response.data;
  },
  sharedKeyringCategories: async (tu: string,ai : string) => {
    const response = await api.get(
      `${ENDPOINTS.SHARE_KEYRING_CATEGORY.PUT_GET}?target_user=${tu}&access_id=${ai}`,
    );
    return response.data;
  },
  updateSharedKeyringCategories: async (payload: PutPaylodProps,tu:string) => {
    const response = await api.put(
      `${ENDPOINTS.SHARE_KEYRING_CATEGORY.PUT_GET}?target_user=${tu}`,
      payload
    );
    return response.data;
  },
};
