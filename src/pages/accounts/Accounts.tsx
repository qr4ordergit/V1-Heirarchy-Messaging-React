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
  SegmentedControl,
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
  IconEdit,
  IconLock,
  IconLockOpen,
  IconUsersGroup,
  IconEye,
  IconEyeOff,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import {
  fetchAccounts,
  createAccount,
  deleteAccount,
  changePassword,
  updateUserLock,
  type Account,
} from "../../api/accountApi";
import { suggestUsername, logout } from "../../api/authApi";
import { useAuthStore } from "../../store/auth/auth.store";
import { ROUTES } from "../../router/routes";
import Avatar from "../../component/avatar/Avatar";
import PermissionsModal from "../../component/permissions/PermissionsModal";
import ManageSubUsersModal from "../../component/manageSubUsers/ManageSubUsersModal";
import { encryptPasskey, decryptPasskey } from "../../utils/passkeyCipher";
import classes from "./Accounts.module.css";
import { ClearStore } from "../../store/clear.store";

type IdentifierType = "username" | "email" | "phone";

interface NewAccountForm {
  identifierType: IdentifierType;
  username: string;
  email: string;
  phone: string;
  password: string;
}

const EMPTY_FORM: NewAccountForm = {
  identifierType: "username",
  username: "",
  email: "",
  phone: "",
  password: "",
};

interface NewAccountErrors {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const PASSKEY_PATTERN = /^[a-zA-Z0-9]{4,12}$/;

const getDisplayName = (account: Account) =>
  account.display_name?.trim() ||
  account.email?.split("@")[0] ||
  account.user_id;

const getInitialsSource = (account: Account) => getDisplayName(account);

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

export default function Accounts() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const setTargetUser = useAuthStore((state) => state.setTargetUser);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewAccountForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<NewAccountErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const [usernameVerified, setUsernameVerified] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(
    null,
  );

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
  const [manageSubUsersTarget, setManageSubUsersTarget] =
    useState<Account | null>(null);
  const [visiblePasskeys, setVisiblePasskeys] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const setField = (field: keyof NewAccountForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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

  const fetchUsernameSuggestionsOnce = async (rawUsername: string) => {
    const trimmed = rawUsername.trim().replace(/-/g, "");
    if (trimmed.length < 3) return;

    setUsernameChecking(true);
    try {
      const result = await suggestUsername(trimmed);
      setUsernameSuggestions(result.suggestions ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not check username.";

      setUsernameSuggestions([]);

      notifications.show({
        color: "red",
        title: "Username unavailable",
        message,
      });
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleIdentifierChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      identifierType: value as IdentifierType,
      username: "",
      email: "",
      phone: "",
    }));
    setFormErrors({});
    setUsernameSuggestions([]);

    setUsernameVerified(false);
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.replace(/[#\s-]/g, "");
    setField("username")(sanitized);
    setUsernameVerified(false);
    setUsernameSuggestions([]);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setField("username")(suggestion);
    setUsernameVerified(true);
  };

  const validate = (): boolean => {
    const errors: NewAccountErrors = {};
    if (form.identifierType === "username") {
      if (!form.username.trim()) {
        errors.username = "Username is required";
      } else if (!usernameVerified) {
        errors.username = "Please select a suggested username";
      }
    }
    if (form.identifierType === "email") {
      if (!form.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        errors.email = "Enter a valid email";
      }
    }
    if (form.identifierType === "phone" && !form.phone.trim()) {
      errors.phone = "Phone number is required";
    }
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClose = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSubmitError(null);
    setUsernameSuggestions([]);

    setUsernameVerified(false);
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

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      await createAccount({
        identifierType: form.identifierType,
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      handleClose();
      await loadAccounts();
      notifications.show({
        color: "teal",
        title: "Account added",
        message: "The new account was created successfully.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create account.";
      setSubmitError(message);
      notifications.show({
        color: "red",
        title: "Couldn't add account",
        message,
      });
    } finally {
      setSubmitting(false);
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
  useEffect(() => {
    loadAccounts();
  }, []);

  const usernameTrimmedLength = form.username.trim().length;
  const wandDisabled = usernameTrimmedLength < 3 || usernameVerified;

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
            placeholder="Search accounts by name, email, or ID"
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
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text
                          fw={600}
                          truncate="end"
                          className={classes.accountName}
                          onClick={() => {
                            setTargetUser(account.user_id);
                            navigate(`/${ROUTES.CHATS}`);
                          }}
                        >
                          {getDisplayName(account)}
                        </Text>

                        <Group gap={6} mt={4}>
                          {account.status && (
                            <Badge
                              size="sm"
                              variant="light"
                              color={statusColor(account.status)}
                              radius="sm"
                            >
                              {account.status}
                            </Badge>
                          )}
                          <Badge
                            size="sm"
                            variant="light"
                            color={account.isLocked ? "dark" : "gray"}
                            radius="sm"
                            leftSection={
                              account.isLocked ? (
                                <IconLock size={10} />
                              ) : (
                                <IconLockOpen size={10} />
                              )
                            }
                            onClick={() => openLockModal(account)}
                            style={{ cursor: "pointer" }}
                          >
                            {account.isLocked ? "Locked" : "Unlocked"}
                          </Badge>
                          {account.isLocked && (
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
                          )}
                        </Group>

                        {isPasskeyVisible && (
                          <Text
                            size="xs"
                            c="dimmed"
                            mt={4}
                            ff="monospace"
                            truncate="end"
                          >
                            Passkey: {plainPasskey || "—"}
                          </Text>
                        )}
                      </div>
                    </Group>

                    <Group gap={4} wrap="nowrap">
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
                            leftSection={<IconEdit size={14} />}
                            onClick={() =>
                              setPermissionsUserId(account.user_id)
                            }
                          >
                            Edit Permissions
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconKey size={14} />}
                            onClick={() => setPasswordTarget(account)}
                          >
                            Change Password
                          </Menu.Item>
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
                            Set Passkey
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconUsersGroup size={14} />}
                            onClick={() => setManageSubUsersTarget(account)}
                          >
                            Manage Sub Users
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

      <Modal
        opened={modalOpen}
        onClose={handleClose}
        title="Create Account"
        centered
        radius="md"
        size="lg"
      >
        <Stack gap="md">
          {submitError && (
            <Alert color="red" title="Couldn't add account">
              {submitError}
            </Alert>
          )}

          <div>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={6}>
              Add via
            </Text>
            <SegmentedControl
              fullWidth
              value={form.identifierType}
              onChange={handleIdentifierChange}
              data={[
                { label: "Username", value: "username" },
                { label: "Phone", value: "phone" },
              ]}
            />
          </div>

          {form.identifierType === "username" && (
            <div>
              <TextInput
                label="Username"
                classNames={{ label: classes.fieldLabel }}
                placeholder="Enter username"
                value={form.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                error={formErrors.username}
                rightSection={
                  usernameChecking ? (
                    <Loader size={14} />
                  ) : (
                    <Button
                      size="xs"
                      variant="subtle"
                      disabled={wandDisabled}
                      onClick={() =>
                        fetchUsernameSuggestionsOnce(form.username)
                      }
                    >
                      Verify
                    </Button>
                  )
                }
                rightSectionWidth={70}
              />

              {usernameSuggestions.length > 0 && (
                <Stack gap={4} mt={6}>
                  {usernameSuggestions && (
                    <Text size="xs" c="dimmed">
                      {"Choose one of the suggested usernames below"}
                    </Text>
                  )}
                  <Group gap={6}>
                    {usernameSuggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        size="compact-xs"
                        variant={
                          form.username === suggestion.replace(/[#\s-]/g, "") &&
                          usernameVerified
                            ? "filled"
                            : "light"
                        }
                        radius="xl"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Group>
                </Stack>
              )}
            </div>
          )}

          {form.identifierType === "phone" && (
            <TextInput
              label="Phone Number"
              classNames={{ label: classes.fieldLabel }}
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => setField("phone")(e.target.value)}
              error={formErrors.phone}
            />
          )}

          <PasswordInput
            label="Password"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Enter password"
            value={form.password}
            onChange={(e) => setField("password")(e.target.value)}
            error={formErrors.password}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              radius="xl"
              variant="gradient"
              loading={submitting}
              disabled={form.identifierType === "username" && !usernameVerified}
              onClick={handleSubmit}
            >
              Add Account
            </Button>
          </Group>
        </Stack>
      </Modal>

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
            <strong>{deleteTarget ? getDisplayName(deleteTarget) : ""}</strong>{" "}
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
              {passwordTarget ? getDisplayName(passwordTarget) : ""}
            </strong>
            .
          </Text>

          <PasswordInput
            label="New Password"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirm New Password"
            classNames={{ label: classes.fieldLabel }}
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
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
            <strong>{lockTarget ? getDisplayName(lockTarget) : ""}</strong> to
            only known contacts with a passkey.
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

      <PermissionsModal
        opened={permissionsUserId !== null}
        userId={permissionsUserId}
        onClose={() => setPermissionsUserId(null)}
        onSaved={loadAccounts}
      />
      <ManageSubUsersModal
        opened={manageSubUsersTarget !== null}
        targetUser={manageSubUsersTarget}
        onClose={() => setManageSubUsersTarget(null)}
      />
    </div>
  );
}
