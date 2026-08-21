import { Table } from "@mantine/core";
import {
  PERMISSION_GROUP_LABELS,
  PERMISSION_LABELS,
} from "../../utils/constant";

type PermissionGroup = Record<string, boolean>;

type Permissions = Record<string, PermissionGroup>;

interface PermissionHeaderProps {
  data: Permissions;
}

export default function PermissionTableHeader({
  data,
}: PermissionHeaderProps) {
  return (
    <>
      {/* Group headers */}
      <Table.Tr>
        {Object.entries(data).map(
          ([groupKey, permissions]) => {
            const permissionCount =
              Object.keys(permissions).length;

            return (
              <Table.Th
                key={groupKey}
                colSpan={permissionCount}
                ta="center"
                style={{
                  whiteSpace: "nowrap",
                }}
              >
                {PERMISSION_GROUP_LABELS[groupKey] ??
                  groupKey}
              </Table.Th>
            );
          },
        )}
      </Table.Tr>

      {/* Permission headers */}
      <Table.Tr>
        {Object.entries(data).map(
          ([groupKey, permissions]) =>
            Object.keys(permissions).map(
              (permissionKey) => {
                const path = `${groupKey}.${permissionKey}`;

                return (
                  <Table.Th
                    key={path}
                    ta="center"
                    style={{
                      whiteSpace: "nowrap",
                    }}
                  >
                    {PERMISSION_LABELS[path] ??
                      permissionKey}
                  </Table.Th>
                );
              },
            ),
        )}
      </Table.Tr>
    </>
  );
}