import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";

import PermissionTableHeader from "./PermissionTableHeader";

import {
  PERMISSION_GROUP_LABELS,
  PERMISSION_LABELS,
  PERMISSIONS,
} from "../../utils/constant";

import {
  getPermissionValue,
  setPermissionValue,
  type Permissions,
} from "../../utils/permission";

import { Notification } from "../../utils/notification";
import { AcessAndPermissionService } from "../../api/services/access.permission.service";
import { useMediaQuery } from "@mantine/hooks";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface UpdateUserPermissionsPayload {
  username: string;
  permissions: Permissions;
}

type UserPermissionChanges = Record<string, UpdateUserPermissionsPayload>;

interface userDetails {
  id: string;
  label: string | null;
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
  const mobileAndTabScreen = useMediaQuery("(max-width: 800px)");

  const permissionColumns = Object.entries(PERMISSIONS).flatMap(
    ([group, permissions]) =>
      Object.keys(permissions).map((permission) => ({
        id: `${group}.${permission}`,
        path: `${group}.${permission}`,
      })),
  );

  const [loading, setLoading] = useState(false);
  const [loadingAP, setLoadingAP] = useState(false);

  const [changes, setChanges] = useState<UserPermissionChanges>({});
  const [openedUserAcc, setOpenedUserAcc] = useState<string | null>(null);

  const handlePermissionChange = (
    username: string,
    permissionId: string,
    checked: boolean,
  ) => {
    setChanges((previous) => {
      const existingUser = previous[username];

      const currentPermissions = existingUser?.permissions ?? {};

      const updatedPermissions = setPermissionValue(
        currentPermissions,
        permissionId,
        checked,
      );

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
            permissions: user.permissions,
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
      <Flex justify="center" align="center" h="calc(100dvh - 120px)">
        <Loader size="xs" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="calc(100dvh - 120px)" gap="md">
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          border: "1px solid var(--mantine-color-gray-3)",
          borderRadius: 10,
        }}
      >
        <ScrollArea
          h="100%"
          type="auto"
          scrollbarSize={0}
          p={mobileAndTabScreen ? "xs" : ""}
        >
          {!mobileAndTabScreen ? (
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
                      background: "var(--mantine-color-gray-1)",
                }}
              >
                <Table.Tr>
                  <Table.Th
                    rowSpan={3}
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 12,
                      textAlign: "center",
                      borderLeft: 0,
                      background: "var(--mantine-color-gray-1)",
                    }}
                  >
                    Username
                  </Table.Th>

                  <Table.Th
                    rowSpan={3}
                    style={{
                      textAlign: "center",
                    }}
                  >
                    Access
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
                        const checked = getPermissionValue(
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
          ) : (
            <Stack gap={"xs"}>
              <Text size="xs" c={"dimmed"} ms={"xs"}>
                Access
              </Text>
              {users.map((user) => {
                const currentUser = changes[user.id];
                const canUserAccess = Boolean(currentUser);

                const opend = openedUserAcc === user.id;
                return (
                  <Box
                    key={user.id}
                    style={{
                      border: "1px solid var(--mantine-color-gray-3)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <Flex
                      align={"center"}
                      gap={"md"}
                      justify={"space-between"}
                      style={{
                        padding: "5px 10px",
                        cursor: canUserAccess ? "pointer" : "not-allowed",
                        background: opend
                          ? "var(--mantine-color-gray-3)"
                          : "white",
                      }}
                      onClick={() =>
                        canUserAccess &&
                        setOpenedUserAcc((prev) =>
                          prev === user.id ? null : user.id,
                        )
                      }
                    >
                      <Flex align={"center"} gap={"xs"}>
                        <Checkbox
                          size="xs"
                          checked={canUserAccess}
                          onChange={(event) => {
                            event.stopPropagation();
                            handleAccessChange(
                              user.id,
                              event.currentTarget.checked,
                            );
                            setOpenedUserAcc(null);
                          }}
                        />
                        <Text size="xs" fw={"bolder"}>
                          {user.label}
                        </Text>
                      </Flex>
                      {!opend ? (
                        <IconChevronDown size={15} />
                      ) : (
                        <IconChevronUp size={15} />
                      )}
                    </Flex>
                    {opend && (
                      <Stack
                        p="xs"
                        bg="white"
                        style={{
                          borderTop: "1px solid var(--mantine-color-gray-3)",
                        }}
                        gap={"lg"}
                      >
                        {Object.entries(PERMISSIONS).map(
                          ([groupKey, permissions]) => (
                            <Stack key={groupKey} gap="xs">
                              <Text size="xs" c="dimmed">
                                {PERMISSION_GROUP_LABELS[groupKey] ?? groupKey}
                              </Text>

                              <Flex gap="md" style={{ flexWrap: "wrap" }}>
                                {Object.keys(permissions).map(
                                  (permissionKey) => {
                                    const path = `${groupKey}.${permissionKey}`;

                                    const checked = getPermissionValue(
                                      currentUser?.permissions ?? {},
                                      path,
                                    );

                                    return (
                                      <Checkbox
                                        key={path}
                                        size="xs"
                                        checked={checked}
                                        disabled={!canUserAccess}
                                        label={
                                          PERMISSION_LABELS[path] ??
                                          permissionKey
                                        }
                                        onChange={(event) =>
                                          handlePermissionChange(
                                            user.id,
                                            path,
                                            event.currentTarget.checked,
                                          )
                                        }
                                      />
                                    );
                                  },
                                )}
                              </Flex>
                            </Stack>
                          ),
                        )}
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </ScrollArea>
      </Box>

      <Flex justify="flex-end">
        <Button
          size="compact-xs"
          onClick={handleSave}
          disabled={loading}
          loading={loading}
        >
          Save changes
        </Button>
      </Flex>
    </Flex>
  );
}
