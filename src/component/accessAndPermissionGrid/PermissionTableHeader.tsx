import { Table } from "@mantine/core";
import { PERMISSION_LABELS } from "../../utils/constant";

type PermissionNode = {
  [key: string]: boolean | PermissionNode;
};

interface PermissionHeaderProps {
  data: PermissionNode;
}

const isLeaf = (
  value: boolean | PermissionNode,
): value is boolean => {
  return typeof value === "boolean";
};

const formatLabel = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function PermissionTableHeader({
  data,
}: PermissionHeaderProps) {
  const headers: {
    path: string;
    label: string;
  }[] = [];

  const buildHeaders = (
    currentData: PermissionNode,
    parentPath = "",
  ) => {
    Object.entries(currentData).forEach(([key, value]) => {
      const currentPath = parentPath
        ? `${parentPath}.${key}`
        : key;

      if (isLeaf(value)) {
        headers.push({
          path: currentPath,
          label:
            PERMISSION_LABELS[currentPath] ??
            formatLabel(key),
        });

        return;
      }

      buildHeaders(value, currentPath);
    });
  };

  buildHeaders(data);

  return (
    <Table.Tr>
      {headers.map(({ path, label }) => (
        <Table.Th
          key={path}
          ta="center"
          style={{
            whiteSpace: "nowrap",
            backgroundColor:
              "var(--mantine-color-gray-1)",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          {label}
        </Table.Th>
      ))}
    </Table.Tr>
  );
}