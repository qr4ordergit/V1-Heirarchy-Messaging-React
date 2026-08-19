import type { PermissionNode } from "../../utils/permission";
import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

interface UpdateUserPermissionsProps {
  username: string;
  permissions: PermissionNode;
}

interface UpdateAccessAndPermissionProps {
  target_user: string;
  sub_users: UpdateUserPermissionsProps[];
}

export const AcessAndPermissionService = {
  getAccessAndPermission: async (target_user: string) => {
    const res = await api.get(
      `${ENDPOINTS.ACCESS_PERMISSION.GET}?target_user=${target_user}`,
    );
    return res.data;
  },
  updateAccessAndPermission: async (data: UpdateAccessAndPermissionProps) => {
    const res = await api.patch(ENDPOINTS.ACCESS_PERMISSION.PATCH, data);
    return res.data;
  },
};
