import { withTargetUser } from "../../utils/constant";
import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

interface LeaveGroup { 
  group_id : string;
  operation : string;
}

export const GroupService = {
  getGroups: async () => {
    const response = await api.get(withTargetUser(ENDPOINTS.GROUPS.LIST));
    return response.data;
  },
   leaveGroup: async (data: LeaveGroup) => {
      const response = await api.post(withTargetUser(ENDPOINTS.GROUPS.LEAVE),data);
      return response.data;
    },
};
