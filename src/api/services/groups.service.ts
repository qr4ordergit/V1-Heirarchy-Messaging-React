import { withTargetUser } from "../../utils/constant";
import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

export const GroupService = {
  getGroups: async () => {
    const response = await api.get(withTargetUser(ENDPOINTS.GROUPS.LIST));
    return response.data;
  },
};
