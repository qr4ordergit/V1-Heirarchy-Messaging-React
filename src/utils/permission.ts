export type PermissionNode = {
  [key: string]: boolean | PermissionNode;
};

export interface FlatPermission {
  id: string;
  name: string;
  path: string;
}

export const flattenPermissions = (
  data: PermissionNode,
  parentPath = "",
): FlatPermission[] => {
  const result: FlatPermission[] = [];

  Object.entries(data).forEach(([key, value]) => {
    const path = parentPath ? `${parentPath}.${key}` : key;

    if (typeof value === "boolean") {
      result.push({
        id: path,
        name: key,
        path,
      });
    } else {
      result.push(...flattenPermissions(value, path));
    }
  });

  return result;
};

export const setNestedPermission = (
  permissions: PermissionNode,
  path: string,
  checked: boolean,
): PermissionNode => {
  const keys = path.split(".");

  const result: PermissionNode = structuredClone(permissions);

  const removeEmptyParents = (
    obj: PermissionNode,
    keys: string[],
    index: number,
  ): boolean => {
    const key = keys[index];

    if (index === keys.length - 1) {
      if (checked) {
        obj[key] = true;
      } else {
        delete obj[key];
      }
    } else {
      if (
        typeof obj[key] !== "object" ||
        obj[key] === null
      ) {
        if (checked) {
          obj[key] = {};
        } else {
          return false;
        }
      }

      const child = obj[key] as PermissionNode;

      removeEmptyParents(child, keys, index + 1);

      if (Object.keys(child).length === 0) {
        delete obj[key];
      }
    }

    return Object.keys(obj).length === 0;
  };

  removeEmptyParents(result, keys, 0);

  return result;
};

export const getNestedPermission = (
  permissions: PermissionNode,
  path: string,
): boolean => {
  const keys = path.split(".");

  let current: boolean | PermissionNode = permissions;

  for (const key of keys) {
    if (
      typeof current !== "object" ||
      current === null
    ) {
      return false;
    }

    current = current[key];
  }

  return typeof current === "boolean"
    ? current
    : false;
};

export const removeFalsePermissions = (
  permissions: PermissionNode,
): PermissionNode => {
  const result: PermissionNode = {};

  Object.entries(permissions).forEach(
    ([key, value]) => {
      if (typeof value === "boolean") {
        if (value) {
          result[key] = true;
        }

        return;
      }

      const nested = removeFalsePermissions(value);

      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    },
  );

  return result;
};