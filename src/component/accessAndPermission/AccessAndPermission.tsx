import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Loader,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";


import {
  PERMISSION_GROUP_LABELS,
  PERMISSION_LABELS,
  PERMISSIONS,
} from "../../utils/constant";

import {
  getPermissionValue,
  hasAllPermissions,
  setAllPermissions,
  setPermissionValue,
  type PermissionsType,
} from "../../utils/permission";

import { Notification } from "../../utils/notification";
import { AcessAndPermissionService } from "../../api/services/access.permission.service";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface UpdateUserPermissionsPayload {
  username: string;
  permissions: PermissionsType;
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

export default function AccessAndPermission({
  users,
  targetUser,
}: AccessAndPermissionGridProps) {

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
          p={"xs"}
        >
            <Stack gap={"xs"}>
              <Text size="xs" fw={"bolder"} c={"gray"} ms={"xs"}>
                Access
              </Text>
              {users.map((user) => {
                const currentUser = changes[user.id];
                const canUserAccess = Boolean(currentUser);

                const opend = openedUserAcc === user.id;

                const userHasPermission =
                  changes[user.id] &&
                  Object.keys(changes[user.id].permissions).length > 0;

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
                        bg="white"
                        style={{
                          borderTop: "1px solid var(--mantine-color-gray-3)",
                        }}
                        gap={"lg"}
                        pl={{base : "xs", xs: "xl" }}
                        pt="xs"
                        pb="xs"
                        pr="xs"
                      >
                        <Checkbox
                          size="xs"
                          label="Select All"
                          checked={
                            userHasPermission
                              ? hasAllPermissions(
                                  changes[user.id].permissions,
                                  PERMISSIONS,
                                )
                              : false
                          }
                          disabled={!canUserAccess}
                          onChange={(event) => {
                            const checked = event.currentTarget.checked;

                            setChanges((prev) => {
                              const currentUser = prev[user.id];

                              return {
                                ...prev,
                                [user.id]: {
                                  username: user.id,
                                  permissions: setAllPermissions(
                                    userHasPermission
                                      ? currentUser.permissions
                                      : PERMISSIONS,
                                    checked,
                                  ),
                                },
                              };
                            });
                          }}
                        />
                        {Object.entries(PERMISSIONS).map(
                          ([groupKey, permissions]) => (
                            <Stack key={groupKey} gap="xs">
                              <Text size="xs" fw={"bolder"} c={"gray"}>
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
