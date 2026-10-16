import { withTargetUser } from "../../utils/constant";
import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

export const KeyringCategories = {
  get: async () => {
    const response = await api.get(
      withTargetUser(ENDPOINTS.KEYRING_CATEGORIES.LIST),
    );
    return response.data;
  },
  otp: async (keyring_category_id: string, otp: string) => {
    const response = await api.get(
      withTargetUser(ENDPOINTS.KEYRING_CATEGORIES.LIST),
      {
        params: {
          keyring_category_id: keyring_category_id,
          otp: otp,
        },
      },
    );
    return response.data;
  },
};
