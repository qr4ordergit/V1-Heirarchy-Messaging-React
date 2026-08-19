import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Loader,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";

import PermissionTableHeader from "./PermissionTableHeader";

import { PERMISSIONS } from "../../utils/constant";

import {
  flattenPermissions,
  getNestedPermission,
  removeFalsePermissions,
  setNestedPermission,
  type PermissionNode,
} from "../../utils/permission";

import { Notification } from "../../utils/notification";
import { AcessAndPermissionService } from "../../api/services/access.permission.service";

interface UpdateUserPermissionsPayload {
  username: string;
  permissions: PermissionNode;
}

type UserPermissionChanges = Record<string, UpdateUserPermissionsPayload>;

interface userDetails {
  id: string;
  label : string | null
}

interface AccessAndPermissionGridProps {
  users: userDetails[];
  targetUser: string;
}

interface AccessAndPermissionResponse {
  sub_users: UpdateUserPermissionsPayload[];
}

export default function AccessAndPermissionGrid({
  users,
  targetUser,
}: AccessAndPermissionGridProps) {
  const permissionColumns = flattenPermissions(PERMISSIONS);

  const [loading, setLoading] = useState(false);
  const [loadingAP, setLoadingAP] = useState(false);

  const [changes, setChanges] = useState<UserPermissionChanges>({});

  const handlePermissionChange = (
    username: string,
    permissionId: string,
    checked: boolean,
  ) => {
    setChanges((previous) => {
      const existingUser = previous[username];

      const currentPermissions = existingUser?.permissions ?? {};

      const updatedPermissions = setNestedPermission(
        currentPermissions,
        permissionId,
        checked,
      );

      if (Object.keys(updatedPermissions).length === 0) {
        const updatedChanges = { ...previous };

        delete updatedChanges[username];

        return updatedChanges;
      }

      return {
        ...previous,

        [username]: {
          username,
          permissions: updatedPermissions,
        },
      };
    });
  };

  const handleAccessChange = (username: string, checked: boolean) => {
    setChanges((previous) => {
      if (checked) {
        return {
          ...previous,

          [username]: {
            username,
            permissions: {},
          },
        };
      }

      const updatedChanges = { ...previous };

      delete updatedChanges[username];

      return updatedChanges;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        target_user: targetUser,
        sub_users: Object.values(changes),
      };

      await AcessAndPermissionService.updateAccessAndPermission(payload);

      Notification.success("Access & Permission updated");
    } catch (error) {
      if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAccessAndPermissions = async () => {
    try {
      setLoadingAP(true);

      const res = (await AcessAndPermissionService.getAccessAndPermission(
        targetUser,
      )) as AccessAndPermissionResponse;

      const formattedChanges = res.sub_users.reduce<UserPermissionChanges>(
        (result, user) => {
          result[user.username] = {
            username: user.username,
            permissions: removeFalsePermissions(user.permissions),
          };

          return result;
        },
        {},
      );

      setChanges(formattedChanges);
    } catch (error) {
      if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      setLoadingAP(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccessAndPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingAP) {
    return (
      <Flex justify="center" align="center" h="calc(100dvh - 80px)">
        <Loader size="xs" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="calc(100dvh - 80px)" gap="md">
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          border: "1px solid var(--mantine-color-gray-3)",
          borderRadius: 10,
        }}
      >
        <ScrollArea h="100%" type="auto" scrollbarSize={0}>
          <Table
            withColumnBorders
            horizontalSpacing={6}
            verticalSpacing={6}
            fz="xs"
            style={{
              borderSpacing: 0,
              borderCollapse: "separate",
            }}
            styles={{
              th: {
                borderLeft: "1px solid var(--mantine-color-gray-3)",
                borderBottom: "1px solid var(--mantine-color-gray-3)",
                borderRight: 0,
              },

              td: {
                borderBottom: "1px solid var(--mantine-color-gray-3)",
                borderRight: 0,
              },
            }}
          >
            <Table.Thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <Table.Tr>
                <Table.Th
                  rowSpan={3}
                  style={{
                    position: "sticky",
                    left: 0,
                    top: 0,
                    zIndex: 12,
                    textAlign: "center",
                    background: "var(--mantine-color-gray-1)",
                    borderLeft: 0,
                  }}
                >
                  Username
                </Table.Th>

                <Table.Th
                  rowSpan={3}
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 11,
                    textAlign: "center",
                    background: "var(--mantine-color-gray-1)",
                  }}
                >
                  Access
                </Table.Th>
              </Table.Tr>

              <Table.Tr bg={"var(--mantine-color-gray-1)"}>
                <Table.Th colSpan={7} ta="center">
                  Direct Message ( DM )
                </Table.Th>
                <Table.Th colSpan={4} ta="center">
                  Group Messages
                </Table.Th>
                <Table.Th colSpan={4} ta="center">
                  Group
                </Table.Th>
                <Table.Th colSpan={4} ta="center">
                  Contacts
                </Table.Th>
                <Table.Th colSpan={2} ta="center">
                  Users
                </Table.Th>
                <Table.Th colSpan={4} ta="center">
                  Tags
                </Table.Th>
              </Table.Tr>

              {/* Permission headers */}
              <PermissionTableHeader data={PERMISSIONS} />
            </Table.Thead>

            <Table.Tbody>
              {users.map((user) => {
                const currentUser = changes[user.id];

                const canUserAccess = Boolean(currentUser);

                return (
                  <Table.Tr key={user.id}>
                    <Table.Td
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 6,
                        background: "var(--mantine-color-gray-1)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Text size="xs" fw={600} ta="center">
                        {user.label}
                      </Text>
                    </Table.Td>

                    <Table.Td
                      ta="center"
                      style={{
                        position: "sticky",
                        zIndex: 5,
                      }}
                    >
                      <Flex justify="center">
                        <Checkbox
                          size="xs"
                          checked={canUserAccess}
                          onChange={(event) =>
                            handleAccessChange(
                              user.id,
                              event.currentTarget.checked,
                            )
                          }
                        />
                      </Flex>
                    </Table.Td>

                    {permissionColumns.map((permission) => {
                      const checked = getNestedPermission(
                        currentUser?.permissions ?? {},
                        permission.path,
                      );

                      return (
                        <Table.Td key={permission.id} ta="center">
                          <Flex justify="center">
                            <Checkbox
                              size="xs"
                              checked={checked}
                              disabled={!canUserAccess}
                              onChange={(event) =>
                                handlePermissionChange(
                                  user.id,
                                  permission.path,
                                  event.currentTarget.checked,
                                )
                              }
                            />
                          </Flex>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Box>

      <Flex justify="flex-end">
        <Button
          size="compact-xs"
          onClick={handleSave}
          disabled={Object.keys(changes).length === 0 || loading}
          loading={loading}
        >
          Save changes
        </Button>
      </Flex>
    </Flex>
  );
}
