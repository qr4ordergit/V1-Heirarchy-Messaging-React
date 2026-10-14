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
};
