import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconLogout, IconShieldLock } from "@tabler/icons-react";

import { logout } from "../../api/authApi";
import { useAuthStore } from "../../store/auth/auth.store";
import { ClearStore } from "../../store/clear.store";
import { ROUTES } from "../../router/routes";

export default function Admin() {
  const navigate = useNavigate();

  const clearTokens = useAuthStore((state) => state.clearTokens);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearTokens();
      ClearStore();
      setLoggingOut(false);
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="flex-start" mb="xl">
        <Stack gap={4}>
          <Group gap="xs">
            <IconShieldLock size={22} />
            <Title order={2}>Admin Dashboard</Title>
          </Group>
        </Stack>

        <Button
          variant="outline"
          color="red"
          radius="xl"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          loading={loggingOut}
        >
          Logout
        </Button>
      </Group>

      <Stack gap="xs"></Stack>

      <Text c="dimmed" size="sm" mt="xl">
        Website under construction!!.
      </Text>

      {loggingOut && (
        <Group mt="md">
          <Loader size="xs" />
          <Text size="sm" c="dimmed">
            Signing out...
          </Text>
        </Group>
      )}
    </Container>
  );
}
