import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

interface GetDMs {
  limit: number;
  cursor?: {
    _id: string;
    last_message: string;
  };
}

export const DmService = {
  getDMs: async (data: GetDMs) => {
    const response = await api.post(ENDPOINTS.DM.LIST,data);
    return response.data;
  },
};
