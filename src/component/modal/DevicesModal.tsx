import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconLogout,
} from "@tabler/icons-react";

import { fetchSessions, revokeSession } from "../../api/sessionApi";
import type { ActiveSession } from "../../api/sessionApi";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";
import { useAuthStore } from "../../store/auth/auth.store";
import { ClearStore } from "../../store/clear.store";
import { ROUTES } from "../../router/routes";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const isMobile = (s: ActiveSession) =>
  /android|ios|iphone|ipad/i.test(s.platform ?? "");

const describe = (s: ActiveSession) =>
  [s.platform, s.browser]
    .filter((v) => v && v.toLowerCase() !== "unknown")
    .join(" · ");

const formatDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
};

export default function DevicesModal({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((s) => s.clearTokens);

  const [devices, setDevices] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDevices(await fetchSessions());
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load your devices."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (opened) void load();
  }, [opened, load]);

  const handleLogout = async (device: ActiveSession) => {
    setBusyId(device.id);
    setError(null);
    try {
      await revokeSession(device.id);

      if (device.is_current) {
        clearTokens();
        ClearStore();
        onClose();
        navigate(ROUTES.HOME, { replace: true });
        return;
      }
      setDevices((list) => list.filter((d) => d.id !== device.id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not log out that device."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Logged-in devices"
      centered
      size="md"
    >
      <Stack gap="sm">
        {error && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertTriangle size={16} />}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : devices.length === 0 && !error ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No devices are logged in.
          </Text>
        ) : (
          devices.map((device) => (
            <Card key={device.id} withBorder radius="md" p="sm">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                  <ThemeIcon variant="light" size="lg" radius="md">
                    {isMobile(device) ? (
                      <IconDeviceMobile size={18} />
                    ) : (
                      <IconDeviceDesktop size={18} />
                    )}
                  </ThemeIcon>
                  <div style={{ minWidth: 0 }}>
                    <Group gap={6}>
                      <Text fw={600} size="sm" truncate>
                        {device.device_name || describe(device) || "Device"}
                      </Text>
                      {device.is_current && (
                        <Badge size="xs" color="green" variant="light">
                          This device
                        </Badge>
                      )}
                    </Group>
                    {describe(device) && (
                      <Text size="xs" c="dimmed">
                        {describe(device)}
                      </Text>
                    )}
                    {formatDate(device.created_at) && (
                      <Text size="xs" c="dimmed">
                        Signed in {formatDate(device.created_at)}
                      </Text>
                    )}
                  </div>
                </Group>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  loading={busyId === device.id}
                  disabled={busyId !== null && busyId !== device.id}
                  onClick={() => handleLogout(device)}
                >
                  Log out
                </Button>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Modal>
  );
}
