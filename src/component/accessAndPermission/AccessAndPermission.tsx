import { useEffect, useState } from "react";

import {
  ActionIcon,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  Loader,
  Modal,
  MultiSelect,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  type ComboboxItem,
} from "@mantine/core";

import {
  COMMON_PERMISSION_GROUP_LABELS,
  PERMISSION_LABELS,
  USER_TO_USER_PERMISSIONS,
} from "../../utils/constant";

import {
  getPermissionValue,
  hasAllPermissions,
  isPermissionDisabled,
  setAllPermissions,
  setPermissionValue,
  type PermissionsType,
} from "../../utils/permission";

import { Notification } from "../../utils/notification";
import { AcessAndPermissionService } from "../../api/services/access.permission.service";
import {
  IconChecks,
  IconChevronDown,
  IconChevronUp,
  IconKey,
} from "@tabler/icons-react";
import axios from "axios";
import { useTranslation } from "../../store/language/language.store";
import { ShareKeyringCategoryService } from "../../api/services/share.keyring.category.service";

interface UpdateUserPermissionsPayload {
  username: string;
  permissions: PermissionsType;
}

type UserPermissionChanges = Record<string, UpdateUserPermissionsPayload>;

interface userDetails {
  id: string;
  label: string | null;
  display_name: string | null;
  description: string | null;
}

interface AccessAndPermissionGridProps {
  users: userDetails[];
  targetUser: string;
  targetUserName: string | null;
}

interface AccessAndPermissionResponse {
  sub_users: UpdateUserPermissionsPayload[];
}

interface SelectedAccountState {
  id: string;
  name: string | null;
}

interface KeyringCategory {
  _id: string;
  keyring_category_name: string;
}
interface SharedKCLoadingState {
  list: boolean;
  update: boolean;
}

export default function AccessAndPermission({
  users,
  targetUser,
  targetUserName,
}: AccessAndPermissionGridProps) {
  const { translation } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [loadingAP, setLoadingAP] = useState(false);

  const [changes, setChanges] = useState<UserPermissionChanges>({});

  const [openedUserAcc, setOpenedUserAcc] = useState<string | null>(null);

  const [openedShareKeyringCategory, setOpenedShareKeyringCategory] =
    useState<boolean>(false);

  const [selectedAccount, setSelectedAccount] = useState<SelectedAccountState>({
    id: "",
    name: "",
  });

  const [sharedKCLoading, setSharedKCLoading] = useState<SharedKCLoadingState>({
    list: false,
    update: false,
  });

  const [keyringCategoriesOption, setKeyringCategoriesOption] = useState<
    ComboboxItem[]
  >([]);

  const [selectedKeyringCategories, setSelectedKeyringCategories] = useState<
    string[]
  >([]);

  const handleLoadingSharedKC = (status: boolean, type: string) => {
    setSharedKCLoading((prev) => ({ ...prev, [type]: status }));
  };

  const handlePermissionChange = (
    username: string,
    permissionId: string,
    checked: boolean,
  ) => {
    setChanges((previous) => {
      const existingUser = previous[username];

      const currentPermissions = {
        ...USER_TO_USER_PERMISSIONS,
        ...(existingUser?.permissions ?? {}),
      };

      let updatedPermissions = setPermissionValue(
        currentPermissions,
        permissionId,
        checked,
      );

      if (
        (permissionId.endsWith("|read") && !checked) ||
        (permissionId.endsWith("|history-get") && !checked)
      ) {
        const groupKey = permissionId.split("|")[0];

        const groupPermissions = updatedPermissions[groupKey];

        if (groupPermissions) {
          updatedPermissions = {
            ...updatedPermissions,
            [groupKey]: Object.keys(groupPermissions).reduce(
              (group, key) => {
                group[key] = false;
                return group;
              },
              {} as Record<string, boolean>,
            ),
          };
        }
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

      Notification.success(
        translation(
          "manage_access_permissions_modal.success_msg",
          "Access & Permission updated",
        ),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
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
          const updatedPermission = structuredClone(user.permissions);
          delete updatedPermission["sub-users"].read;
          delete updatedPermission["shared-keyring-category"].create;
          result[user.username] = {
            username: user.username,
            permissions: updatedPermission,
          };

          return result;
        },
        {},
      );

      setChanges(formattedChanges);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
      setChanges({});
    } finally {
      setLoadingAP(false);
    }
  };

  const getKeyringCategories = async (tu: string) => {
    try {
      handleLoadingSharedKC(true, "list");
      const res = await ShareKeyringCategoryService.keyringCategories(tu);

      setKeyringCategoriesOption(
        res.data.map((i: KeyringCategory) => ({
          value: i._id,
          label: i.keyring_category_name,
        })),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      handleLoadingSharedKC(false, "list");
    }
  };

  const getSharedKeyringCategories = async (tu: string) => {
    try {
      handleLoadingSharedKC(true, "list");
      const res = await ShareKeyringCategoryService.sharedKeyringCategories(
        targetUser,
        tu,
      );

      setSelectedKeyringCategories(res.data.keyring_category_ids);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      handleLoadingSharedKC(false, "list");
    }
  };

  const fetchKeyringCategoryData = async (tu: string) => {
    await getSharedKeyringCategories(tu);
    await getKeyringCategories(tu);
  };

  const handleSelectAll = () => {
    setSelectedKeyringCategories(
      keyringCategoriesOption.map((item) =>
        typeof item === "string" ? item : item.value,
      ),
    );
  };

  const saveSharedKeyringCategories = async () => {
    try {
      handleLoadingSharedKC(true, "update");
      await ShareKeyringCategoryService.updateSharedKeyringCategories(
        {
          keyring_category_id: selectedKeyringCategories,
          username: selectedAccount.id,
        },
        targetUser,
      );
      Notification.success(
        translation(
          "manage_access_permissions_modal.succ_msg_keyring_category_shared",
          "Keyring category shared successfully",
        ),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      handleLoadingSharedKC(false, "update");
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
        <ScrollArea h="100%" type="auto" scrollbarSize={0} p={"xs"}>
          <Stack gap={"xs"}>
            <Flex justify={"space-between"} pr={45}>
              <Text size="xs" fw={"bolder"} c={"gray"} ms={"xs"}>
                {translation(
                  "manage_access_permissions_modal.label_access",
                  "Access",
                )}
              </Text>
              <Flex gap={2} align={"center"}>
                <Text size="xs" fw={"bolder"} c={"gray"} ms={"xs"}>
                  {translation(
                    "manage_access_permissions_modal.label_share_keyring_categories",
                    "Share Keyring Categories",
                  )}
                </Text>
                <IconKey size={14} color={"gray"} />
              </Flex>
            </Flex>
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
                    align="center"
                    gap="md"
                    justify="space-between"
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
                    {/* Left side */}
                    <Flex align="center" gap="xs" className="min-w-0 flex-1">
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

                      {user.display_name !== "" ? (
                        <Stack gap={0} className="min-w-0 flex-1">
                          <Text size="xs" fw="bolder">
                            {user.display_name}
                          </Text>
                          {user.description !== "" ? (
                            <Text size="xs" c="gray" truncate>
                              {user.label} | {user.description}
                            </Text>
                          ) : (
                            <Text size="xs" c="gray">
                              {user.label}
                            </Text>
                          )}
                        </Stack>
                      ) : user.description !== "" ? (
                        <Text
                          size="xs"
                          fw="bolder"
                          truncate
                          className="min-w-0 flex-1"
                        >
                          {user.label} |{" "}
                          <span style={{ color: "gray", fontWeight: "normal" }}>
                            {user.description}
                          </span>
                        </Text>
                      ) : (
                        <Text size="xs" fw="bolder">
                          {user.label}
                        </Text>
                      )}
                    </Flex>

                    {canUserAccess && (
                      <Tooltip
                        label={`
                          ${user.display_name !== "" ? user.display_name : user.label}'s
                        ${translation(
                          "manage_access_permissions_modal.tooltip_share_keyring_category",
                          "Keyring Categories",
                        )}
                        `}
                        fz={"xs"}
                      >
                        <ActionIcon
                          variant="subtle"
                          color="cyan"
                          radius={"sm"}
                          size={"sm"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenedShareKeyringCategory(true);
                            setSelectedAccount({
                              id: user.id,
                              name:
                                user.display_name !== ""
                                  ? user.display_name
                                  : user.label,
                            });
                            fetchKeyringCategoryData(user.id);
                          }}
                        >
                          <IconKey size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}

                    {/* Arrow */}
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
                      pl={{ base: "xs", xs: "xl" }}
                      pt="xs"
                      pb="xs"
                      pr="xs"
                    >
                      <Checkbox
                        size="xs"
                        label={translation(
                          "manage_access_permissions_modal.label_select_all",
                          "Select All",
                        )}
                        checked={
                          userHasPermission
                            ? hasAllPermissions(
                                changes[user.id].permissions,
                                USER_TO_USER_PERMISSIONS,
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
                                    : USER_TO_USER_PERMISSIONS,
                                  checked,
                                ),
                              },
                            };
                          });
                        }}
                      />
                      {Object.entries(USER_TO_USER_PERMISSIONS).map(
                        ([groupKey, permissions]) => (
                          <Stack key={groupKey} gap="xs">
                            <Text size="xs" fw={"bolder"} c={"gray"}>
                              {translation(
                                `permission_group_labels.${groupKey}`,
                                COMMON_PERMISSION_GROUP_LABELS[groupKey] ??
                                  groupKey,
                              )}
                            </Text>

                            <Flex gap="md" style={{ flexWrap: "wrap" }}>
                              {Object.keys(permissions).map((permissionKey) => {
                                const path = `${groupKey}|${permissionKey}`;

                                const checked = getPermissionValue(
                                  currentUser?.permissions ?? {},
                                  path,
                                );

                                const disabled = isPermissionDisabled(
                                  groupKey,
                                  permissionKey,
                                  Object.keys(currentUser?.permissions).length >
                                    0
                                    ? currentUser?.permissions
                                    : USER_TO_USER_PERMISSIONS,
                                );

                                return (
                                  <Checkbox
                                    key={path}
                                    size="xs"
                                    checked={checked}
                                    disabled={disabled}
                                    label={translation(
                                      `permission_labels.${path}`,
                                      PERMISSION_LABELS[path] ?? permissionKey,
                                    )}
                                    onChange={(event) =>
                                      handlePermissionChange(
                                        user.id,
                                        path,
                                        event.currentTarget.checked,
                                      )
                                    }
                                  />
                                );
                              })}
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
          {translation(
            "manage_access_permissions_modal.btn_save_changes",
            "Save changes",
          )}
        </Button>
      </Flex>

      <Modal
        centered
        opened={openedShareKeyringCategory}
        onClose={() => {
          setOpenedShareKeyringCategory(false);
          setSelectedAccount({ id: "", name: "" });
          setSelectedKeyringCategories([]);
        }}
        title={
          <Text size="xs">
            {translation(
              "manage_access_permissions_modal.modal_titile_1_share_keyring_category",
              "Share Keyring Category of",
            )}{" "}
            <b>{selectedAccount.name}</b>{" "}
            {translation(
              "manage_access_permissions_modal.modal_titile_2_share_keyring_category",
              "with",
            )}{" "}
            <b>{targetUserName}</b>
          </Text>
        }
      >
        {sharedKCLoading.list ? (
          <Center>
            <Loader size={"xs"} />
          </Center>
        ) : (
          <>
            <Flex align="center" gap="xs" w="100%">
              <MultiSelect
                size="xs"
                style={{ flex: 1, minWidth: 0 }}
                placeholder={translation(
                  "manage_access_permissions_modal.placeholder_select_keyring_categories",
                  "Select keyring categories",
                )}
                data={keyringCategoriesOption}
                value={selectedKeyringCategories}
                onChange={setSelectedKeyringCategories}
                searchable
                clearable
              />
              <Tooltip
                fz={"xs"}
                label={translation(
                  "manage_access_permissions_modal.tooltip_select_all_keyring_category",
                  "Select all",
                )}
              >
                <ActionIcon
                  variant="subtle"
                  size="md"
                  style={{ flexShrink: 0 }}
                  onClick={handleSelectAll}
                >
                  <IconChecks size={16} />
                </ActionIcon>
              </Tooltip>
            </Flex>
            <Flex justify="flex-end" mt={"sm"}>
              <Button
                size="compact-xs"
                onClick={saveSharedKeyringCategories}
                disabled={sharedKCLoading.update}
                loading={sharedKCLoading.update}
              >
                {translation(
                  "manage_access_permissions_modal.btn_save_changes",
                  "Save changes",
                )}
              </Button>
            </Flex>
          </>
        )}
      </Modal>
    </Flex>
  );
}
