import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Container,
  Group,
  Select,
  Stack,
  Title,
  Text,
  type ComboboxItem,
} from "@mantine/core";
import classes from "./Admin.module.css";
import { IconLogout, IconShieldLock } from "@tabler/icons-react";

import { logout } from "../../api/authApi";
import { useAuthStore } from "../../store/auth/auth.store";
import { ClearStore } from "../../store/clear.store";
import { ROUTES } from "../../router/routes";
import ManageLanguages from "./manageLanguages/ManageLanguages";
import ManageVideo from "./ManageVideos/ManageVideos";
import ManageBillings from "./manageBillings/ManageBillings";
import logo from "../../assets/logo.png";

export default function Admin() {
  const navigate = useNavigate();

  const clearTokens = useAuthStore((state) => state.clearTokens);

  const [loggingOut, setLoggingOut] = useState(false);
  const [value, setValue] = useState<ComboboxItem | null>(null);
  const data = [
    { value: "language", label: "Manage languages" },
    { value: "manage_video", label: "Manage videos" },
    { value: "billing", label: "Manage Billing" },
  ] as const;

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
      <Group justify="space-between" align="center" mb="md">
        <Stack gap={6}>
          <Group gap="sm" align="center" wrap="nowrap">
            <div className={classes.brandLogoWrap}>
              <img
                src={logo}
                alt="Ukrchat logo"
                className={classes.brandLogo}
              />
            </div>
            <Text className={classes.brand}>Ukrchat.com</Text>
          </Group>
        </Stack>

        <Button
          size="xs"
          variant="outline"
          color="red"
          radius="xl"
          leftSection={<IconLogout size={14} />}
          onClick={handleLogout}
          loading={loggingOut}
        >
          Logout
        </Button>
      </Group>
      <Group gap="xs">
        <IconShieldLock size={18} />
        <Title order={5}>Admin Dashboard</Title>
      </Group>
      <Select
        size="xs"
        mb={"md"}
        style={{ maxWidth: "300px", marginTop: "10px" }}
        placeholder="Select setting"
        data={data}
        value={value ? value.value : null}
        onChange={(_value, option) => setValue(option)}
      />

      {value !== null && value.value === "language" && <ManageLanguages />}
      {value !== null && value.value === "manage_video" && <ManageVideo />}
      {value !== null && value.value === "billing" && <ManageBillings />}
    </Container>
  );
}
