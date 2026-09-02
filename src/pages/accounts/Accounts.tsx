import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import {
  ActionIcon,
  Alert,
  Avatar as MantineAvatar,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Menu,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Switch,
  Tooltip,
  Flex,
  Checkbox,
  ScrollArea,
  ThemeIcon,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconKey,
  IconLogout,
  IconPlus,
  IconTrash,
  IconLock,
  IconLockOpen,
  IconEye,
  IconEyeOff,
  IconSearch,
  IconX,
  IconMail,
  IconUserEdit,
  IconCopy,
  IconCheck,
  IconPencil,
  IconShieldLock,
} from "@tabler/icons-react";

import {
  fetchAccounts,
  deleteAccount,
  changePassword,
  updateUserLock,
  updateUserProfile,
  type Account,
  type UpdateProfilePayload,
} from "../../api/accountApi";

import { logout } from "../../api/authApi";
import { uploadImageToS3Api } from "../../api/profileApi";
import {
  useAuthStore,
  isHubAccount,
  type UserDetails,
} from "../../store/auth/auth.store";
import { ROUTES } from "../../router/routes";
import Avatar from "../../component/avatar/Avatar";

import { encryptPasskey, decryptPasskey } from "../../utils/passkeyCipher";
import { initials } from "../../config/avatarColors";
import classes from "./Accounts.module.css";
import { ClearStore } from "../../store/clear.store";
import AccessAndPermission from "../../component/accessAndPermission/AccessAndPermission";

import CreateAccountModal from "./Createaccountmodal";

import {
  PERMISSION_GROUP_LABELS,
  PERMISSION_LABELS,
  PERMISSIONS,
} from "../../utils/constant";
import {
  getPermissionValue,
  setPermissionValue,
  hasAnyPermission,
  hasAllPermissions,
  setAllPermissions,
} from "../../utils/permission";
import {
  AcessAndPermissionService,
  type UpdatePermissionsProps,
} from "../../api/services/access.permission.service";
import { Notification } from "../../utils/notification";
import { fetchUserDetails } from "../../api/userApi";
//import { useDisableBackButton } from "../../hooks/useDisableBackButton";
const PASSKEY_PATTERN = /^[a-zA-Z0-9]{4,12}$/;

const getDisplayName = (account: Account) =>
  account.display_name?.trim() || account.user_id;

const getInitialsSource = (account: Account) => getDisplayName(account);

const getAccountIdentifier = (account: Account) => {
  if (account?.display_name?.trim()) return account.display_name.trim();
  if (account?.phone_number?.trim()) return account.phone_number.trim();
  return account.user_id;
};
const getHubIdentifier = (account: Account) => {
  if (account?.display_name?.trim()) return account.display_name.trim();
  if (account?.email?.trim()) return account.email.trim();
  if (account?.phone_number?.trim()) return account.phone_number.trim();
  return account.user_id;
};
const statusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "teal";
    case "pending":
      return "yellow";
    case "suspended":
    case "inactive":
      return "red";
    default:
      return "gray";
  }
};

interface AccessAndPermissionsState {
  open: boolean;
  targetUser: string;
  label: string | null;
  display_name: string | null;
}

export default function Accounts() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const setTargetUser = useAuthStore((state) => state.setTargetUser);
  const setTargetUserDetails = useAuthStore(
    (state) => state.setTargetUserDetails,
  );

  const isHubAccountLoggedIn = isHubAccount(userDetails);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [passwordTarget, setPasswordTarget] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileTarget, setProfileTarget] = useState<Account | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);

  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const [lockTarget, setLockTarget] = useState<Account | null>(null);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [passkeyPrefilled, setPasskeyPrefilled] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [savingLock, setSavingLock] = useState(false);

  const [visiblePasskeys, setVisiblePasskeys] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");

  const [perType, setPerType] = useState<string>("User Permission");

  const [accessAndPermissions, setAccessAndPermissions] =
    useState<AccessAndPermissionsState>({
      open: false,
      targetUser: "",
      label: "",
      display_name: "",
    });

  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingP, setLoadingP] = useState(false);
  const [changes, setChanges] = useState<UpdatePermissionsProps>({
    target_user: accessAndPermissions.targetUser,
    permissions: {},
  });

  const onOpenAccessAndPermissions = (
    user_id: string,
    label: string | null,
    display_name: string | null,
  ) => {
    setAccessAndPermissions({
      open: true,
      targetUser: user_id,
      label: label,
      display_name: display_name,
    });
  };

  const onCloseAccessAndPermissions = () => {
    setAccessAndPermissions({
      open: false,
      targetUser: "User Permission",
      label: "",
      display_name: "",
    });
    setPerType("User Permission");
  };

  const users = structuredClone(accounts)
    .filter(
      (acc) =>
        acc.user_id !== accessAndPermissions.targetUser &&
        acc.user_id !== userDetails?.username,
    )
    .map((acc) => ({
      id: acc.user_id,
      label: acc.phone_number !== "" ? acc.phone_number : acc.user_id,
      display_name: acc.display_name !== "" ? acc.display_name : "",
    }));

  const togglePasskeyVisibility = (account: Account) => {
    setVisiblePasskeys((prev) => ({
      ...prev,
      [account.user_id]: !prev[account.user_id],
    }));
  };

  const getPlainPasskey = (account: Account) => {
    if (!account.passkey_hash) return "";
    try {
      return decryptPasskey(account.passkey_hash, account.user_id);
    } catch {
      return "";
    }
  };

  const loadAccounts = async (userDetailsOverride?: UserDetails | null) => {
    setLoading(true);
    setError(null);

    const effectiveUserDetails = userDetailsOverride ?? userDetails;

    const currentUser: Account | null = effectiveUserDetails
      ? {
          user_id: effectiveUserDetails.username,
          display_name: effectiveUserDetails.display_name ?? null,
          email: effectiveUserDetails.email ?? "",
          phone_number: effectiveUserDetails.phone_number ?? "",
          profile_picture: effectiveUserDetails.profile_picture ?? null,
          description: effectiveUserDetails.description ?? "",
          status: "active",
          isLocked: effectiveUserDetails.isLocked ?? false,
          passkey_hash: effectiveUserDetails.passkey_hash ?? "",
        }
      : null;

    try {
      const subAccounts = await fetchAccounts();

      const allAccounts = currentUser
        ? [currentUser, ...subAccounts]
        : subAccounts;

      setAccounts(allAccounts);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load accounts.";

      const isPermissionError =
        /You do not have permission to perform this operation/i.test(message);

      if (isPermissionError && currentUser) {
        setAccounts([currentUser]);
      } else {
        setError(message);

        notifications.show({
          color: "red",
          title: "Couldn't load accounts",
          message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountsChanged = async () => {
    setSearchQuery("");
    await loadAccounts();
  };

  const openLockModal = (account: Account) => {
    setLockTarget(account);
    setLockEnabled(account.isLocked);

    const existingPlaintext = account.passkey_hash
      ? decryptPasskey(account.passkey_hash, account.user_id)
      : "";
    setPasskey(existingPlaintext);

    setLockError(null);
  };

  const closeLockModal = () => {
    setLockTarget(null);
    setLockEnabled(false);
    setPasskey("");
    setPasskeyPrefilled(false);
    setLockError(null);
  };

  const openProfileModal = (account: Account) => {
    setProfileTarget(account);
    setProfileForm({
      display_name: account.display_name ?? "",
      phone_number: account.phone_number ?? "",
      description: account.description ?? "",
    });
    setProfilePictureFile(null);
    setProfilePicturePreview(account.profile_picture || null);
    setProfileError(null);
  };

  const closeProfileModal = () => {
    setProfileTarget(null);
    setProfileForm({});
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setProfileError(null);
  };

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfilePictureFile(file);
    setProfilePicturePreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleSaveProfile = async () => {
    if (!profileTarget) return;

    setProfileError(null);
    setSavingProfile(true);

    const isSelf = profileTarget.user_id === userDetails?.username;

    try {
      const payload: UpdateProfilePayload = Object.fromEntries(
        Object.entries({
          display_name: profileForm.display_name?.trim(),
          description: profileForm.description?.trim(),
          ...(profilePictureFile
            ? { profile_picture: profilePictureFile.name }
            : {}),
        }).filter(
          ([_, value]) => typeof value !== "string" || value.trim() !== "",
        ),
      ) as UpdateProfilePayload;

      const response = await updateUserProfile(
        payload,
        isSelf ? undefined : profileTarget.user_id,
      );

      let uploadedPictureUrl: string | null = null;

      if (profilePictureFile && response.profile_picture_upload_url) {
        await uploadImageToS3Api(
          response.profile_picture_upload_url,
          profilePictureFile,
        );

        uploadedPictureUrl = URL.createObjectURL(profilePictureFile);
      }

      if (isSelf && userDetails) {
        setUserDetails({
          ...userDetails,
          ...(uploadedPictureUrl
            ? { profile_picture: uploadedPictureUrl }
            : {}),
        });
      }

      notifications.show({
        title: "",
        message: response.message || "Profile updated successfully.",
        color: "green",
      });

      closeProfileModal();
      await loadAccounts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update profile.";
      setProfileError(message);
      notifications.show({
        color: "red",
        title: "Couldn't update profile",
        message,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyUsername = async (account: Account) => {
    const markCopied = () => {
      setCopiedUserId(account.user_id);
      window.setTimeout(() => {
        setCopiedUserId((current) =>
          current === account.user_id ? null : current,
        );
      }, 1500);
    };

    const copyWithFallback = (): boolean => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = account.user_id;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        const succeeded = document.execCommand("copy");
        document.body.removeChild(textarea);
        return succeeded;
      } catch {
        return false;
      }
    };

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(account.user_id);
        markCopied();
        return;
      }

      if (copyWithFallback()) {
        markCopied();
        return;
      }

      throw new Error("Copy not supported");
    } catch {
      notifications.show({
        color: "red",
        title: "Couldn't copy",
        message: "Could not copy username. Please copy it manually.",
      });
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout request failed:", err);
      notifications.show({
        color: "red",
        title: "Logout issue",
        message:
          "You've been signed out locally, but the server logout failed.",
      });
    } finally {
      clearTokens();
      ClearStore();
      setLoggingOut(false);
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deleteTarget.user_id);
      setDeleteTarget(null);
      await loadAccounts();
      notifications.show({
        color: "teal",
        title: "Account removed",
        message: "The account was removed successfully.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not remove account.";
      setDeleteError(message);
      notifications.show({
        color: "red",
        title: "Couldn't remove account",
        message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const closePasswordModal = () => {
    setPasswordTarget(null);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError(null);
  };

  const handleChangePasswordConfirm = async () => {
    if (!passwordTarget) return;

    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const isSelf = passwordTarget.user_id === userDetails?.username;
      await changePassword(
        passwordTarget.user_id,
        newPassword,
        confirmNewPassword,
        isSelf,
      );
      closePasswordModal();
      notifications.show({
        color: "teal",
        title: "Password updated",
        message: "The password was changed successfully.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not change password.";
      setPasswordError(message);
      notifications.show({
        color: "red",
        title: "Couldn't change password",
        message,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveLock = async () => {
    if (!lockTarget) return;
    setLockError(null);

    let encryptedPasskey = "";

    if (lockEnabled) {
      const trimmed = passkey.trim();
      if (!trimmed) {
        setLockError("Enter a passkey to enable locking.");
        return;
      }
      if (!PASSKEY_PATTERN.test(trimmed)) {
        setLockError("Passkey must be 4–12 letters and/or numbers only.");
        return;
      }
      encryptedPasskey = encryptPasskey(trimmed, lockTarget.user_id);
    }

    const isSelf = lockTarget.user_id === userDetails?.username;

    setSavingLock(true);
    try {
      await updateUserLock(
        lockEnabled,
        encryptedPasskey,
        isSelf ? undefined : lockTarget.user_id,
      );
      closeLockModal();

      if (isSelf) {
        try {
          const refreshedDetails = await fetchUserDetails();
          setUserDetails(refreshedDetails);
          await loadAccounts(refreshedDetails);
        } catch (refreshErr) {
          console.error("Failed to refresh user details:", refreshErr);
          await loadAccounts();
        }
      } else {
        await loadAccounts();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not lock.";
      setLockError(message);
      notifications.show({
        color: "red",
        title: "Couldn't update lock",
        message,
      });
    } finally {
      setSavingLock(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const haystack = [
      getAccountIdentifier(account),
      account.display_name,
      account.email,
      account.user_id,
      account.phone_number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const handleSave = async () => {
    try {
      setLoadingSave(true);

      await AcessAndPermissionService.updatePermission(changes);

      Notification.success("Access & Permission updated");
    } catch (error) {
      if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      setLoadingSave(false);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const target_user = accessAndPermissions.targetUser;

    setChanges((previous) => {
      const currentPermissions = previous?.permissions ?? {};

      const updatedPermissions = setPermissionValue(
        currentPermissions,
        permissionId,
        checked,
      );

      return {
        target_user,
        permissions: updatedPermissions,
      };
    });
  };

  const loadPermissions = async (targetUser: string) => {
    try {
      setLoadingP(true);
      const res = await AcessAndPermissionService.getUserPermission(targetUser);
      delete res.permissions["sub-users"];
      delete res.permissions.keyring;
      delete res.permissions["users-accesstree"].update;
      setChanges(res);
    } catch (error) {
      if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      setLoadingP(false);
    }
  };

  useEffect(() => {
    setTargetUser("");
    setTargetUserDetails(null);

    if (!userDetails) {
      return;
    }

    void loadAccounts();
  }, [userDetails, setTargetUser, setTargetUserDetails]);
  //useDisableBackButton();
  return (
    <div className={classes.wrapper}>
      <Container size="md" py="xl">
        <Group
          justify="space-between"
          align="flex-start"
          mb="lg"
          className={classes.headerGroup}
        >
          <div>
            <Title order={2} className={classes.title} mb={4}>
              Your Accounts
            </Title>
            <Text c="dimmed" size="sm">
              Create multiple accounts and switch between them easily.
            </Text>
          </div>
          <Group gap="sm" className={classes.headerActions}>
            {isHubAccountLoggedIn && (
              <Button
                leftSection={<IconPlus size={16} />}
                radius="xl"
                variant="gradient"
                onClick={() => setModalOpen(true)}
              >
                Add Account
              </Button>
            )}

            <Button
              leftSection={<IconLogout size={16} />}
              radius="xl"
              variant="light"
              color="red"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert color="red" title="Couldn't load accounts" mb="md">
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : accounts.length === 0 ? (
          <Card withBorder radius="md" py="xl">
            <Center>
              <Text c="dimmed" size="sm">
                No accounts found.
              </Text>
            </Center>
          </Card>
        ) : filteredAccounts.length === 0 ? (
          <Card withBorder radius="md" py="xl">
            <Center>
              <Stack gap="sm" align="center">
                <Text c="dimmed" size="sm">
                  No accounts match "{searchQuery}".
                </Text>
                <Button
                  variant="light"
                  radius="xl"
                  size="xs"
                  leftSection={<IconX size={14} />}
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </Stack>
            </Center>
          </Card>
        ) : (
          <Stack gap="xl">
            {filteredAccounts
              .filter((account) => account.user_id === userDetails?.username)
              .map((account) => {
                const isPasskeyVisible = !!visiblePasskeys[account.user_id];
                const plainPasskey = isPasskeyVisible
                  ? getPlainPasskey(account)
                  : "";

                if (isHubAccountLoggedIn) {
                  const identifierValue = getHubIdentifier(account);

                  return (
                    <Card
                      key={account.user_id}
                      withBorder
                      radius="xl"
                      padding="md"
                      className={classes.accountCard}
                      style={{ width: "fit-content" }}
                    >
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon
                          size={36}
                          radius="xl"
                          variant="light"
                          color="indigo"
                        >
                          <IconMail size={18} />
                        </ThemeIcon>

                        <div>
                          <Text size="xs" c="dimmed" fw={500}>
                            Logged in as
                          </Text>
                          <Text size="sm" fw={700}>
                            {identifierValue}
                          </Text>
                        </div>
                      </Group>
                    </Card>
                  );
                }

                return (
                  <Stack key={account.user_id} gap="sm">
                    <Text size="sm" fw={600}>
                      Logged In Account
                    </Text>

                    <Card
                      withBorder
                      radius="md"
                      padding="lg"
                      className={classes.accountCard}
                    >
                      <Group
                        justify="space-between"
                        gap="sm"
                        className={classes.cardRow}
                      >
                        <Group
                          gap="md"
                          wrap="nowrap"
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <Avatar
                            name={getInitialsSource(account)}
                            colorIndex={0}
                            size={48}
                            src={account.profile_picture}
                            onClick={() => {
                              navigate(`/${ROUTES.CHATS}`);
                            }}
                          />

                          <div className={classes.accountInfo}>
                            <Group gap={6} wrap="nowrap" align="center">
                              <Text
                                fw={600}
                                truncate="end"
                                className={classes.accountName}
                                onClick={() => {
                                  navigate(`/${ROUTES.CHATS}`);
                                }}
                              >
                                {getAccountIdentifier(account)}
                              </Text>

                              <Tooltip
                                label={
                                  copiedUserId === account.user_id
                                    ? "Copied!"
                                    : account.user_id
                                }
                              >
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  radius="xl"
                                  size="sm"
                                  aria-label="Copy username"
                                  onClick={() => handleCopyUsername(account)}
                                >
                                  {copiedUserId === account.user_id ? (
                                    <IconCheck size={14} color="teal" />
                                  ) : (
                                    <IconCopy size={14} />
                                  )}
                                </ActionIcon>
                              </Tooltip>

                              {!isMobile && (
                                <ActionIcon
                                  variant="subtle"
                                  color={account.isLocked ? "dark" : "gray"}
                                  radius="xl"
                                  size="sm"
                                  aria-label={
                                    account.isLocked
                                      ? "Account is locked"
                                      : "Account is unlocked"
                                  }
                                  onClick={() => openLockModal(account)}
                                >
                                  {account.isLocked ? (
                                    <IconLock size={14} color="red" />
                                  ) : (
                                    <Tooltip label="Lock with passkey">
                                      <IconLockOpen size={14} />
                                    </Tooltip>
                                  )}
                                </ActionIcon>
                              )}

                              {!isMobile && account.isLocked && (
                                <>
                                  <Badge
                                    size="sm"
                                    variant="light"
                                    color="red"
                                    radius="sm"
                                    onClick={() => openLockModal(account)}
                                    style={{
                                      cursor: "pointer",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {isPasskeyVisible
                                      ? plainPasskey || "—"
                                      : "••••••"}
                                  </Badge>

                                  <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    radius="xl"
                                    size="sm"
                                    aria-label={
                                      isPasskeyVisible
                                        ? "Hide passkey"
                                        : "Show passkey"
                                    }
                                    onClick={() =>
                                      togglePasskeyVisibility(account)
                                    }
                                  >
                                    {isPasskeyVisible ? (
                                      <IconEyeOff size={14} />
                                    ) : (
                                      <IconEye size={14} />
                                    )}
                                  </ActionIcon>
                                </>
                              )}
                            </Group>

                            {account.status && (
                              <Group gap={6} mt={4} align="center">
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color={statusColor(account.status)}
                                  radius="sm"
                                >
                                  {account.status}
                                </Badge>
                              </Group>
                            )}
                          </div>
                        </Group>

                        <Group gap="lg" className={classes.cardActions}>
                          <Menu
                            position="bottom-end"
                            withinPortal
                            shadow="md"
                            radius="md"
                          >
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                radius="xl"
                                aria-label="Account options"
                              >
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                              {isMobile && (
                                <>
                                  <Menu.Item
                                    leftSection={
                                      account.isLocked ? (
                                        <IconLock size={14} />
                                      ) : (
                                        <IconLockOpen size={14} />
                                      )
                                    }
                                    onClick={() => openLockModal(account)}
                                  >
                                    Passkey & Lock
                                  </Menu.Item>
                                  <Menu.Divider />
                                </>
                              )}

                              <Menu.Item
                                leftSection={<IconUserEdit size={14} />}
                                onClick={() => openProfileModal(account)}
                              >
                                Update Profile
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconKey size={14} />}
                                onClick={() => setPasswordTarget(account)}
                              >
                                Change Password
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Group>
                    </Card>
                  </Stack>
                );
              })}

            {filteredAccounts.some(
              (account) => account.user_id !== userDetails?.username,
            ) && (
              <Stack gap="sm">
                <Text size="sm" fw={600}>
                  Accounts you can access:
                </Text>
                {accounts.length > 0 && (
                  <TextInput
                    placeholder="Search by username"
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                      searchQuery ? (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          radius="xl"
                          aria-label="Clear search"
                          onClick={() => setSearchQuery("")}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      ) : null
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    radius="xl"
                    // mb="lg"
                    name="account-search"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    classNames={{ input: classes.searchInput }}
                  />
                )}

                <Stack gap="md">
                  {filteredAccounts
                    .filter(
                      (account) => account.user_id !== userDetails?.username,
                    )
                    .map((account, i) => {
                      const isPasskeyVisible =
                        !!visiblePasskeys[account.user_id];

                      const plainPasskey = isPasskeyVisible
                        ? getPlainPasskey(account)
                        : "";

                      return (
                        <Card
                          key={account.user_id}
                          withBorder
                          radius="md"
                          padding="lg"
                          className={classes.accountCard}
                        >
                          <div className={classes.cardGrid}>
                            <div className={classes.cardGridAvatar}>
                              <Avatar
                                name={getInitialsSource(account)}
                                colorIndex={i + 1}
                                size={48}
                                src={account.profile_picture}
                                onClick={() => {
                                  setTargetUser(account.user_id);
                                  setTargetUserDetails(account);
                                  navigate(`/${ROUTES.CHATS}`);
                                }}
                              />
                            </div>

                            <div className={classes.cardGridName}>
                              <Group gap={6} wrap="nowrap" align="center">
                                <Text
                                  fw={600}
                                  truncate="end"
                                  className={classes.accountName}
                                  onClick={() => {
                                    setTargetUser(account.user_id);
                                    setTargetUserDetails(account);
                                    navigate(`/${ROUTES.CHATS}`);
                                  }}
                                >
                                  {getAccountIdentifier(account)}
                                </Text>

                                <Tooltip
                                  label={
                                    copiedUserId === account.user_id
                                      ? "Copied!"
                                      : account.user_id
                                  }
                                >
                                  <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    radius="xl"
                                    size="sm"
                                    aria-label="Copy username"
                                    onClick={() => handleCopyUsername(account)}
                                  >
                                    {copiedUserId === account.user_id ? (
                                      <IconCheck size={14} color="teal" />
                                    ) : (
                                      <IconCopy size={14} />
                                    )}
                                  </ActionIcon>
                                </Tooltip>

                                {!isMobile && (
                                  <ActionIcon
                                    variant="subtle"
                                    color={account.isLocked ? "dark" : "gray"}
                                    radius="xl"
                                    size="sm"
                                    aria-label={
                                      account.isLocked
                                        ? "Account is locked"
                                        : "Account is unlocked"
                                    }
                                    onClick={() => openLockModal(account)}
                                  >
                                    {account.isLocked ? (
                                      <IconLock size={14} color="red" />
                                    ) : (
                                      <Tooltip label="Lock with passkey">
                                        <IconLockOpen size={14} />
                                      </Tooltip>
                                    )}
                                  </ActionIcon>
                                )}

                                {!isMobile && account.isLocked && (
                                  <>
                                    <Badge
                                      size="sm"
                                      variant="light"
                                      color="red"
                                      radius="sm"
                                      onClick={() => openLockModal(account)}
                                      style={{
                                        cursor: "pointer",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {isPasskeyVisible
                                        ? plainPasskey || "—"
                                        : "••••••"}
                                    </Badge>

                                    <ActionIcon
                                      variant="subtle"
                                      color="gray"
                                      radius="xl"
                                      size="sm"
                                      aria-label={
                                        isPasskeyVisible
                                          ? "Hide passkey"
                                          : "Show passkey"
                                      }
                                      onClick={() =>
                                        togglePasskeyVisibility(account)
                                      }
                                    >
                                      {isPasskeyVisible ? (
                                        <IconEyeOff size={14} />
                                      ) : (
                                        <IconEye size={14} />
                                      )}
                                    </ActionIcon>
                                  </>
                                )}
                              </Group>
                            </div>

                            <div className={classes.cardGridKebab}>
                              <Menu
                                position="bottom-end"
                                withinPortal
                                shadow="md"
                                radius="md"
                              >
                                <Menu.Target>
                                  <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    radius="xl"
                                    aria-label="Account options"
                                  >
                                    <IconDotsVertical size={16} />
                                  </ActionIcon>
                                </Menu.Target>

                                <Menu.Dropdown>
                                  {isMobile && (
                                    <>
                                      <Menu.Item
                                        leftSection={
                                          account.isLocked ? (
                                            <IconLock size={14} />
                                          ) : (
                                            <IconLockOpen size={14} />
                                          )
                                        }
                                        onClick={() => openLockModal(account)}
                                      >
                                        Passkey & Lock
                                      </Menu.Item>
                                      <Menu.Item
                                        leftSection={
                                          <IconShieldLock size={14} />
                                        }
                                        onClick={() => {
                                          loadPermissions(account.user_id);
                                          onOpenAccessAndPermissions(
                                            account.user_id,
                                            account.phone_number !== ""
                                              ? account.phone_number
                                              : account.user_id,
                                            account.display_name,
                                          );
                                        }}
                                      >
                                        Manage Access & Permissions
                                      </Menu.Item>
                                      <Menu.Divider />
                                    </>
                                  )}

                                  <Menu.Item
                                    leftSection={<IconUserEdit size={14} />}
                                    onClick={() => openProfileModal(account)}
                                  >
                                    Update Profile
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconKey size={14} />}
                                    onClick={() => setPasswordTarget(account)}
                                  >
                                    Change Password
                                  </Menu.Item>

                                  {isHubAccountLoggedIn && (
                                    <>
                                      <Menu.Divider />

                                      <Menu.Item
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={() => setDeleteTarget(account)}
                                      >
                                        Remove Account
                                      </Menu.Item>
                                    </>
                                  )}
                                </Menu.Dropdown>
                              </Menu>
                            </div>

                            <div className={classes.cardGridMeta}>
                              {account.status && (
                                <Group gap={6} mb={4} align="center">
                                  <Badge
                                    size="sm"
                                    variant="light"
                                    color={statusColor(account.status)}
                                    radius="sm"
                                  >
                                    {account.status}
                                  </Badge>
                                </Group>
                              )}

                              {account.description?.trim() && (
                                <Text size="xs" c="dimmed" truncate="end">
                                  {account.description}
                                </Text>
                              )}
                            </div>

                            {!isMobile && (
                              <div className={classes.cardGridManage}>
                                <Text
                                  size="sm"
                                  c="blue"
                                  fw={500}
                                  style={{
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                  onClick={() => {
                                    loadPermissions(account.user_id);
                                    onOpenAccessAndPermissions(
                                      account.user_id,
                                      account.phone_number !== ""
                                        ? account.phone_number
                                        : account.user_id,
                                      account.display_name,
                                    );
                                  }}
                                >
                                  Manage Access & Permissions
                                </Text>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                </Stack>
              </Stack>
            )}
          </Stack>
        )}
      </Container>

      <CreateAccountModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onAccountCreated={handleAccountsChanged}
      />

      <Modal
        opened={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        title="Remove Account"
        centered
        radius="md"
      >
        <Stack gap="md">
          {deleteError && (
            <Alert color="red" title="Couldn't remove account">
              {deleteError}
            </Alert>
          )}

          <Text size="sm">
            Are you sure you want to remove{" "}
            <strong>
              {deleteTarget ? getAccountIdentifier(deleteTarget) : ""}
            </strong>{" "}
            from your hub? This can't be undone.
          </Text>

          <Group justify="flex-end" mt="xs">
            <Button
              variant="subtle"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              radius="xl"
              loading={deleting}
              onClick={handleDeleteConfirm}
            >
              Remove Account
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={passwordTarget !== null}
        onClose={closePasswordModal}
        title="Change Password"
        centered
        radius="md"
      >
        <Stack gap="md">
          {passwordError && (
            <Alert color="red" title="Couldn't change password">
              {passwordError}
            </Alert>
          )}

          <Text size="sm" c="dimmed">
            Set a new password for{" "}
            <strong>
              {passwordTarget ? getAccountIdentifier(passwordTarget) : ""}
            </strong>
            .
          </Text>

          <PasswordInput
            label="New Password"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            name="new-account-password"
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
          />
          <PasswordInput
            label="Confirm New Password"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            name="confirm-new-account-password"
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button
              radius="xl"
              variant="gradient"
              loading={changingPassword}
              onClick={handleChangePasswordConfirm}
            >
              Update Password
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={profileTarget !== null}
        onClose={closeProfileModal}
        title="Update Profile"
        centered
        radius="md"
      >
        <Stack gap="md">
          {profileError && (
            <Alert color="red" title="Couldn't update profile">
              {profileError}
            </Alert>
          )}

          <Text size="sm" c="dimmed">
            Update profile details for{" "}
            <strong>
              {profileTarget ? getAccountIdentifier(profileTarget) : ""}
            </strong>
            .
          </Text>

          <input
            ref={profilePictureInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            style={{ display: "none" }}
            onChange={handleProfilePictureChange}
          />

          <Group justify="center">
            <div style={{ position: "relative", width: "fit-content" }}>
              <MantineAvatar
                src={profilePicturePreview || undefined}
                size={84}
                radius="xl"
                color="indigo"
              >
                {!profilePicturePreview &&
                  (profileTarget
                    ? initials(getInitialsSource(profileTarget))
                    : "")}
              </MantineAvatar>

              <UnstyledButton
                onClick={() => profilePictureInputRef.current?.click()}
                disabled={savingProfile}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  padding: 6,
                  borderRadius: "50%",
                  background: "var(--mantine-color-indigo-6)",
                  color: "white",
                  border: "2px solid white",
                  cursor: "pointer",
                }}
                aria-label="Change profile picture"
                title="Change profile picture"
              >
                <IconPencil size={14} />
              </UnstyledButton>
            </div>
          </Group>

          <TextInput
            label="Display Name"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Enter display name"
            value={profileForm.display_name ?? ""}
            onChange={(e) =>
              setProfileForm((prev) => ({
                ...prev,
                display_name: e.target.value,
              }))
            }
          />
          <TextInput
            label="Phone Number"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Enter phone number"
            value={profileForm.phone_number ?? ""}
            disabled
          />
          <Textarea
            label="Description / Designation"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Enter description"
            value={profileForm.description ?? ""}
            onChange={(e) =>
              setProfileForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            autosize
            minRows={2}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={closeProfileModal}>
              Cancel
            </Button>
            <Button
              radius="xl"
              variant="gradient"
              loading={savingProfile}
              onClick={handleSaveProfile}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={lockTarget !== null}
        onClose={closeLockModal}
        title="Passkey & Lock"
        centered
        radius="md"
      >
        <Stack gap="md">
          {lockError && (
            <Alert color="red" title="Couldn't update lock">
              {lockError}
            </Alert>
          )}

          <Text size="sm" c="dimmed">
            Restrict{" "}
            <strong>
              {lockTarget ? getAccountIdentifier(lockTarget) : ""}
            </strong>{" "}
            to only known contacts with a passkey.
          </Text>

          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Lock this account with a passkey
            </Text>
            <Switch
              checked={lockEnabled}
              onChange={(e) => setLockEnabled(e.currentTarget.checked)}
            />
          </Group>

          {lockEnabled && (
            <PasswordInput
              label="Passkey"
              classNames={{ label: classes.fieldLabel }}
              placeholder="4-12 letters or numbers"
              value={passkey}
              onChange={(e) => {
                const sanitized = e.target.value
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .slice(0, 12);
                setPasskey(sanitized);
                setPasskeyPrefilled(false);
              }}
              onFocus={() => {
                if (passkeyPrefilled) {
                  setPasskey("");
                  setPasskeyPrefilled(false);
                }
              }}
              description={
                passkeyPrefilled
                  ? "A passkey is already set. Click to enter a new one, or leave as-is to keep it."
                  : "Letters and numbers only, 4–12 characters."
              }
              name="account-passkey"
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
            />
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={closeLockModal}>
              Cancel
            </Button>
            <Button
              radius="xl"
              variant="gradient"
              loading={savingLock}
              onClick={handleSaveLock}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={accessAndPermissions.open}
        onClose={onCloseAccessAndPermissions}
        title={
          <Text>
            {" "}
            Manage Access & Permissions of{" "}
            {accessAndPermissions.display_name !== "" ? (
              <>
                <span style={{ color: "var(--mantine-color-blue-4)" }}>
                  <b>{accessAndPermissions.display_name}</b>
                </span>
                <span style={{ color: "gray", fontSize: "12px" }}>
                  {" "}
                  | {accessAndPermissions.label}
                </span>
              </>
            ) : (
              <span style={{ color: "var(--mantine-color-blue-4)" }}>
                <b>{accessAndPermissions.label}</b>
              </span>
            )}
          </Text>
        }
        fullScreen
        radius={0}
      >
        <Group gap="xs" mb={"md"}>
          {["User Permission", "User to User Permission"].map((name) => (
            <Button
              key={name}
              size="compact-xs"
              radius="xl"
              variant={perType === name ? "filled" : "outline"}
              onClick={() => {
                setPerType(name);
                if (name === "User Permission") {
                  loadPermissions(accessAndPermissions.targetUser);
                }
              }}
            >
              {name}
            </Button>
          ))}
        </Group>
        {perType === "User Permission" ? (
          loadingP ? (
            <Flex justify="center" align="center" h="calc(100dvh - 120px)">
              <Loader size="xs" />
            </Flex>
          ) : (
            <Flex direction="column" h="calc(100dvh - 120px)" gap="md">
              <ScrollArea
                h="100%"
                type="auto"
                scrollbarSize={0}
                pl={{ base: 0, xs: "lg" }}
              >
                <Stack p="xs" bg="white" gap={"lg"}>
                  <Checkbox
                    size="xs"
                    label="Select All"
                    checked={hasAllPermissions(
                      changes.permissions,
                      PERMISSIONS,
                    )}
                    onChange={(event) => {
                      setChanges((prev) => ({
                        ...prev,
                        permissions: setAllPermissions(
                          changes.permissions,
                          event.target.checked,
                        ),
                      }));
                    }}
                  />

                  {Object.entries(PERMISSIONS).map(
                    ([groupKey, permissions]) => (
                      <Stack key={groupKey} gap="xs">
                        <Text size="xs" fw={"bolder"} c={"gray"}>
                          {PERMISSION_GROUP_LABELS[groupKey] ?? groupKey}
                        </Text>

                        <Flex gap="md" style={{ flexWrap: "wrap" }}>
                          {Object.keys(permissions).map((permissionKey) => {
                            const path = `${groupKey}.${permissionKey}`;

                            const checked = getPermissionValue(
                              changes?.permissions ?? {},
                              path,
                            );

                            return (
                              <Checkbox
                                key={path}
                                size="xs"
                                checked={checked}
                                label={PERMISSION_LABELS[path] ?? permissionKey}
                                onChange={(event) =>
                                  handlePermissionChange(
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
              </ScrollArea>
              <Flex justify="flex-end">
                <Button
                  size="compact-xs"
                  onClick={handleSave}
                  loading={loadingSave}
                  disabled={!hasAnyPermission(changes.permissions)}
                >
                  Save changes
                </Button>
              </Flex>
            </Flex>
          )
        ) : (
          <AccessAndPermission
            users={users}
            targetUser={accessAndPermissions.targetUser}
          />
        )}
      </Modal>
    </div>
  );
}
