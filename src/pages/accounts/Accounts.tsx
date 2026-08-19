import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";
import {
  ActionIcon,
  Alert,
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
} from "@tabler/icons-react";

import {
  fetchAccounts,
  deleteAccount,
  changePassword,
  updateUserLock,
  type Account,
} from "../../api/accountApi";
import { logout } from "../../api/authApi";
import { useAuthStore } from "../../store/auth/auth.store";
import { ROUTES } from "../../router/routes";
import Avatar from "../../component/avatar/Avatar";

import { encryptPasskey, decryptPasskey } from "../../utils/passkeyCipher";
import classes from "./Accounts.module.css";
import { ClearStore } from "../../store/clear.store";
import AccessAndPermissionGrid from "../../component/accessAndPermissionGrid/AccessAndPermissionGrid";

import CreateAccountModal from "./Createaccountmodal";

const PASSKEY_PATTERN = /^[a-zA-Z0-9]{4,12}$/;

const getDisplayName = (account: Account) =>
  account.display_name?.trim() || account.user_id;

const getInitialsSource = (account: Account) => getDisplayName(account);

const getAccountIdentifier = (account: Account) =>
  account?.phone_number !== ""
    ? account?.phone_number
    : getDisplayName(account);

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
}

export default function Accounts() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const setTargetUser = useAuthStore((state) => state.setTargetUser);

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

  const [accessAndPermissions, setAccessAndPermissions] =
    useState<AccessAndPermissionsState>({
      open: false,
      targetUser: "",
    });

  const onOpenAccessAndPermissions = (user_id: string) => {
    setAccessAndPermissions({
      open: true,
      targetUser: user_id,
    });
  };

  const onCloseAccessAndPermissions = () => {
    setAccessAndPermissions({
      open: false,
      targetUser: "",
    });
  };

  const users = structuredClone(accounts)
  .sort((a, b) => {
    if (a.user_id === accessAndPermissions.targetUser) return -1;
    if (b.user_id === accessAndPermissions.targetUser) return 1;
    return 0;
  })
  .map((acc) => ({id:acc.user_id,label:acc.phone_number !== "" ? acc.phone_number : acc.user_id}));;

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

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load accounts.";
      setError(message);
      notifications.show({
        color: "red",
        title: "Couldn't load accounts",
        message,
      });
    } finally {
      setLoading(false);
    }
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
      await changePassword(
        passwordTarget.user_id,
        newPassword,
        confirmNewPassword,
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

    setSavingLock(true);
    try {
      await updateUserLock(lockTarget.user_id, lockEnabled, encryptedPasskey);
      closeLockModal();
      await loadAccounts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not lock.";
      setLockError(message);
    } finally {
      setSavingLock(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const haystack = [
      getDisplayName(account),
      account.email ?? "",
      account.user_id,
      account.status ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccounts();
  }, []);
  return (
    <div className={classes.wrapper}>
      <Container size="md" py="xl">
        <Group justify="space-between" align="flex-start" mb="lg">
          <div>
            <Title order={2} className={classes.title} mb={4}>
              Your Accounts
            </Title>
            <Text c="dimmed" size="sm">
              Create multiple accounts and switch between them easily.
            </Text>
          </div>
          <Group gap="sm">
            <Button
              leftSection={<IconPlus size={16} />}
              radius="xl"
              variant="gradient"
              onClick={() => setModalOpen(true)}
            >
              Add Account
            </Button>
            <Button
              leftSection={<IconLogout size={16} />}
              radius="xl"
              variant="subtle"
              color="red"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Group>

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
            mb="md"
            name="account-search"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
        )}

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
              <Text c="dimmed" size="sm">
                No accounts match "{searchQuery}".
              </Text>
            </Center>
          </Card>
        ) : (
          <Stack gap="sm">
            {filteredAccounts?.map((account, i) => {
              const isPasskeyVisible = !!visiblePasskeys[account.user_id];
              const plainPasskey = isPasskeyVisible
                ? getPlainPasskey(account)
                : "";

              return (
                <Card
                  key={account.user_id}
                  withBorder
                  radius="md"
                  padding="md"
                  className={classes.accountCard}
                >
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <Group
                      gap="md"
                      wrap="nowrap"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Avatar
                        name={getInitialsSource(account)}
                        colorIndex={i}
                        size={48}
                        onClick={() => {
                          console.log("Avatar clicked:", account.user_id);
                          setTargetUser(account.user_id);
                          navigate(`/${ROUTES.CHATS}`);
                        }}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Group gap={6} wrap="nowrap" align="center">
                          <Text
                            fw={600}
                            truncate="end"
                            className={classes.accountName}
                            onClick={() => {
                              setTargetUser(account.user_id);
                              navigate(`/${ROUTES.CHATS}`);
                            }}
                          >
                            {getAccountIdentifier(account)}
                          </Text>
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
                              <IconLockOpen size={14} />
                            )}
                          </ActionIcon>

                          {account.isLocked && (
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
                                onClick={() => togglePasskeyVisibility(account)}
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

                    <Group gap="lg" wrap="nowrap">
                      <Text
                        size="sm"
                        c="dimmed"
                        fw={500}
                        style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                        onClick={() =>
                              onOpenAccessAndPermissions(account.user_id)
                            }
                      >
                        Manage Access & Permissions
                      </Text>

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
                          <Menu.Item
                            leftSection={<IconKey size={14} />}
                            onClick={() => setPasswordTarget(account)}
                          >
                            Change Password
                          </Menu.Item>

                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => setDeleteTarget(account)}
                          >
                            Remove Account
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>

      <CreateAccountModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onAccountCreated={loadAccounts}
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
        title="Manage Access & Permissions"
        fullScreen
        radius={0}
      >
        <AccessAndPermissionGrid users={users} targetUser={accessAndPermissions.targetUser}/>
      </Modal>
    </div>
  );
}
