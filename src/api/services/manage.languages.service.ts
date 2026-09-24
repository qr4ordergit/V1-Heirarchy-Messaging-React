import { adminApi } from "../axios";
import { ENDPOINTS } from "../endpoints";

interface UpdateProps {
  data: object;
  file: string;
}

export const ManageLanguagesServices = {
  update: async (data: UpdateProps) => {
    const response = await adminApi.post(
      ENDPOINTS.MANAGE_LANGUAGES.UPDATE,
      data,
    );
    return response.data;
  },
};
