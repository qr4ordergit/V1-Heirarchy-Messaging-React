export type PermissionGroup = Record<string, boolean>;

export type Permissions = Record<string, PermissionGroup>;

export type PermissionsType = Record<
  string,
  Record<string, boolean>
>;

const IGNORED_PERMISSION_GROUPS = [
  "users",
  "users-permissions",
];

export const getPermissionValue = (
  permissions: Permissions,
  path: string,
): boolean => {
  const [group, permission] = path.split(".");

  return permissions[group]?.[permission] ?? false;
};

export const setPermissionValue = (
  permissions: Permissions,
  path: string,
  checked: boolean,
): Permissions => {
  const [group, permission] = path.split(".");

  return {
    ...permissions,
    [group]: {
      ...permissions[group],
      [permission]: checked,
    },
  };
};

export const hasAnyPermission = (
  permissions: PermissionsType,
): boolean => {
  return Object.entries(permissions).some(
    ([group, groupPermissions]) => {
      if (IGNORED_PERMISSION_GROUPS.includes(group)) {
        return false;
      }

      return Object.values(groupPermissions).some(Boolean);
    },
  );
};

export const hasAllPermissions = (
  permissions: PermissionsType,
): boolean => {
  return Object.entries(permissions)
    .filter(
      ([group]) =>
        !IGNORED_PERMISSION_GROUPS.includes(group),
    )
    .every(([, groupPermissions]) =>
      Object.values(groupPermissions).every(Boolean),
    );
};

export const setAllPermissions = (
  permissions: PermissionsType,
  checked: boolean,
): PermissionsType => {
  const updated: PermissionsType = {
    ...permissions,
  };

  Object.entries(updated).forEach(
    ([group, groupPermissions]) => {
      if (IGNORED_PERMISSION_GROUPS.includes(group)) {
        return;
      }

      Object.keys(groupPermissions).forEach(
        (permission) => {
          updated[group][permission] = checked;
        },
      );
    },
  );

  return updated;
};