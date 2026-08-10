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
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconKey,
  IconLogout,
  IconPlus,
  IconTrash,
  IconWand,
  IconEdit,
} from "@tabler/icons-react";

import {
  fetchAccounts,
  createAccount,
  deleteAccount,
  changePassword,
  type Account,
} from "../../api/accountApi";
import { suggestUsername, logout } from "../../api/authApi";
import { useAuthStore } from "../../store/auth/auth.store";
import { ROUTES } from "../../router/routes";
import Avatar from "../../component/avatar/Avatar";
import PermissionsModal from "../../component/permissions/PermissionsModal";
import classes from "./Accounts.module.css";

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
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);

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

  const setField = (field: keyof NewAccountForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
      setUsernameMessage(result.message ?? null);
    } catch {
      setUsernameSuggestions([]);
      setUsernameMessage(null);
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
    setUsernameMessage(null);
    setUsernameVerified(false);
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.replace(/[#\s-]/g, "");
    setField("username")(sanitized);

    setUsernameVerified(false);
    setUsernameSuggestions([]);
    setUsernameMessage(null);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const sanitized = suggestion.replace(/[#\s-]/g, "");
    setField("username")(sanitized);
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
    setUsernameMessage(null);
    setUsernameVerified(false);
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

  useEffect(() => {
    loadAccounts();
  }, []);

  const usernameTrimmedLength = form.username.trim().length;
  const wandDisabled = usernameTrimmedLength < 3 || usernameVerified;

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
        ) : (
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
            {accounts?.map((account, i) => (
              <Card
                key={account.user_id}
                withBorder
                radius="md"
                padding="lg"
                className={classes.accountCard}
                style={{ position: "relative" }}
              >
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
                      style={{ position: "absolute", top: 10, right: 10 }}
                      aria-label="Account options"
                    >
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={() => setPermissionsUserId(account.user_id)}
                    >
                      Edit Permissions
                    </Menu.Item>
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

                <Stack gap="sm" align="center">
                  <Avatar
                    name={getInitialsSource(account)}
                    colorIndex={i}
                    size={56}
                  />
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <Text fw={600} truncate="end">
                      {getDisplayName(account)}
                    </Text>
                  </div>
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
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
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
                    <IconWand
                      size={16}
                      style={{
                        cursor: wandDisabled ? "not-allowed" : "pointer",
                        opacity: wandDisabled ? 0.4 : 1,
                      }}
                      onClick={() =>
                        !wandDisabled &&
                        fetchUsernameSuggestionsOnce(form.username)
                      }
                    />
                  )
                }
              />
              {usernameVerified && !formErrors.username && (
                <Text size="xs" c="teal" mt={4}>
                  Username verified
                </Text>
              )}
              {usernameSuggestions.length > 0 && (
                <Stack gap={4} mt={6}>
                  {usernameMessage && (
                    <Text size="xs" c="dimmed">
                      {usernameMessage}
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

      <PermissionsModal
        opened={permissionsUserId !== null}
        userId={permissionsUserId}
        onClose={() => setPermissionsUserId(null)}
        onSaved={loadAccounts}
      />
    </div>
  );
}
