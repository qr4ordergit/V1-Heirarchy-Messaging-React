import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

interface GetDMs {
  limit: number;
  cursor?: {
    _id: string;
    last_message: string;
  };
}

interface DeleteDM {
  chatID : string;
  action:number
}

export const DmService = {
  getDMs: async (data: GetDMs) => {
    const response = await api.post(ENDPOINTS.DM.LIST,data);
    return response.data;
  },
  deleteDM: async (data: DeleteDM) => {
    const response = await api.post(ENDPOINTS.DM.DELETE,data);
    return response.data;
  },
};
