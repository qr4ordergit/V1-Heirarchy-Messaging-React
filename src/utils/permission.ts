export type PermissionsType = Record<
  string,
  Record<string, boolean>
>;

export const getPermissionValue = (
  permissions: PermissionsType,
  path: string,
): boolean => {
  const [group, permission] = path.split(".");

  return permissions[group]?.[permission] ?? false;
};

export const setPermissionValue = (
  permissions: PermissionsType,
  path: string,
  checked: boolean,
): PermissionsType => {
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
  return Object.values(permissions).some(
    (groupPermissions) =>
      Object.values(groupPermissions).some(Boolean),
  );
};

export const hasAllPermissions = (
  permissions: PermissionsType,
  allPermissions: PermissionsType,
): boolean => {
  return Object.entries(allPermissions).every(
    ([group, groupPermissions]) =>
      Object.keys(groupPermissions).every(
        (permission) =>
          permissions[group]?.[permission] === true,
      ),
  );
};

export const setAllPermissions = (
  allPermissions: PermissionsType,
  checked: boolean,
): PermissionsType => {
  const updated: PermissionsType =
    structuredClone(allPermissions);

  Object.entries(updated).forEach(
    ([group, groupPermissions]) => {
      Object.keys(groupPermissions).forEach(
        (permission) => {
          updated[group][permission] = checked;
        },
      );
    },
  );

  return updated;
};