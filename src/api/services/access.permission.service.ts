import type { PermissionsType } from "../../utils/permission";
import { api } from "../axios";
import { ENDPOINTS } from "../endpoints";

export interface UpdateUserPermissionsProps {
  username: string;
  permissions: PermissionsType;
}

interface UpdateAccessAndPermissionProps {
  target_user: string;
  sub_users: UpdateUserPermissionsProps[];
}
export interface UpdatePermissionsProps {
  target_user: string;
  permissions: PermissionsType;
}

export const AcessAndPermissionService = {
  // user to user
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
  // user
   getUserPermission: async (target_user: string) => {
    const res = await api.get(
      `${ENDPOINTS.PERMISSION.GET}?target_user=${target_user}`,
    );
    return res.data;
  },
   updatePermission: async (data: UpdatePermissionsProps) => {
    const res = await api.patch(ENDPOINTS.PERMISSION.PATCH, data);
    return res.data;
  },
};
