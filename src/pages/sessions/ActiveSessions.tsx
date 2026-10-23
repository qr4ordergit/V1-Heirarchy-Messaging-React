import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconLogout,
} from "@tabler/icons-react";

import { useAuthStore, isAdminAccount } from "../../store/auth/auth.store";
import { ClearStore } from "../../store/clear.store";
import { fetchUserDetails } from "../../api/userApi";
import { revokeAllSessions, revokeSession } from "../../api/sessionApi";
import type { ActiveSession } from "../../api/sessionApi";
import { checkSession } from "../../utils/authFlow";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";
import { ROUTES } from "../../router/routes";

function isMobile(s: ActiveSession) {
  return /android|ios|iphone|ipad/i.test(s.platform ?? "");
}

function describe(s: ActiveSession) {
  const parts = [s.platform, s.browser].filter(
    (v) => v && v.toLowerCase() !== "unknown",
  );
  return parts.join(" · ");
}

function formatDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function ActiveSessions() {
  const navigate = useNavigate();

  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionPending = useAuthStore((s) => s.sessionPending);
  const sessions = useAuthStore((s) => s.pendingSessions);
  const message = useAuthStore((s) => s.sessionMessage);
  const setUserDetails = useAuthStore((s) => s.setUserDetails);
  const clearTokens = useAuthStore((s) => s.clearTokens);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The device was accepted: finish the login exactly like AuthCallback does.
  const finishLogin = useCallback(async () => {
    const details = await fetchUserDetails();
    setUserDetails(details);
    navigate(isAdminAccount(details) ? ROUTES.ADMIN : ROUTES.ACCOUNTS, {
      replace: true,
    });
  }, [navigate, setUserDetails]);

  // Re-asks the backend. Either we are accepted now, or we get a fresh list.
  const recheck = useCallback(async () => {
    setError(null);
    try {
      const result = await checkSession();
      if (result.status === "ok") await finishLogin();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not check your devices."));
    } finally {
      setLoading(false);
    }
  }, [finishLogin]);

  useEffect(() => {
    if (!accessToken) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
    if (!sessionPending) {
      navigate(ROUTES.ACCOUNTS, { replace: true });
      return;
    }
    if (sessions) {
      setLoading(false);
      return;
    }
    // Page refreshed or opened while the check is still running.
    void recheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, sessionPending]);

  const handleLogoutDevice = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await revokeSession(id);
      await recheck();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not log out that device."));
    } finally {
      setBusyId(null);
    }
  };

  const handleLogoutAll = async () => {
    setBusyId("all");
    setError(null);
    try {
      await revokeAllSessions((sessions ?? []).map((s) => s.id));
      await recheck();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not log out all devices."));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = () => {
    clearTokens();
    ClearStore();
    navigate(ROUTES.HOME, { replace: true });
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="sm">
          <Loader />
          <Text c="dimmed" size="sm">
            Checking your devices...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={2}>Device limit reached</Title>

        <Alert
          color="orange"
          icon={<IconAlertTriangle size={18} />}
          title={`Signed in on ${sessions?.length ?? 0} devices`}
        >
          {message ||
            "Log out from one of the devices below to sign in on this one."}
        </Alert>

        {error && (
          <Alert color="red" title="Something went wrong">
            {error}
          </Alert>
        )}

        {(sessions ?? []).map((s) => {
          const Icon = isMobile(s) ? IconDeviceMobile : IconDeviceDesktop;
          const signedIn = formatDate(s.created_at);
          const title = s.device_name || "Unknown device";

          return (
            <Card key={s.id} withBorder radius="md" p="md">
              <Group justify="space-between" wrap="nowrap">
                <Group wrap="nowrap" gap="md">
                  <ThemeIcon variant="light" size="xl" radius="md">
                    <Icon size={24} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>{title}</Text>
                    <Text size="sm" c="dimmed">
                      {describe(s)}
                    </Text>
                    {signedIn && (
                      <Text size="xs" c="dimmed">
                        Signed in: {signedIn}
                      </Text>
                    )}
                  </div>
                </Group>

                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  leftSection={<IconLogout size={14} />}
                  loading={busyId === s.id}
                  disabled={busyId !== null && busyId !== s.id}
                  onClick={() => void handleLogoutDevice(s.id)}
                >
                  Log out
                </Button>
              </Group>
            </Card>
          );
        })}

        <Group justify="space-between" mt="sm">
          <Button variant="default" onClick={handleCancel} disabled={busyId !== null}>
            Cancel
          </Button>
          <Button
            color="red"
            leftSection={<IconLogout size={16} />}
            loading={busyId === "all"}
            disabled={busyId !== null && busyId !== "all"}
            onClick={() => void handleLogoutAll()}
          >
            Log out all devices
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
