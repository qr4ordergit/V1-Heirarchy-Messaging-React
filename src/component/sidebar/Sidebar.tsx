import { Avatar, Stack } from "@mantine/core";
import SidebarItem from "./SidebarItem";
import { navigationItems } from "../../utils/navigation";
import { Button } from "@mantine/core";
import { useAuthStore } from "../../store/auth/auth.store";
import { ROUTES } from "../../router/routes";
import { useNavigate } from "react-router";
import { useState } from "react";
import { logout } from "../../api/authApi";
import { LogOut } from "lucide-react";
export default function Sidebar() {
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
      setLoggingOut(false);
      navigate(ROUTES.HOME, { replace: true });
    }
  };
  return (
    <Stack
      h="100%"
      justify="space-between"
      align="center"
      py="md"
      bg="var(--mantine-color-blue-1)"
    >
      <Stack gap="md">
        {navigationItems.map((item) => (
          <SidebarItem
            key={item.to}
            label={item.label}
            to={item.to}
            Icon={item.icon}
          />
        ))}
      </Stack>
      <Button
        leftSection={<LogOut size={16} />}
        radius="xl"
        variant="subtle"
        color="red"
        loading={loggingOut}
        onClick={handleLogout}
      >
        Logout
      </Button>

      <Avatar radius="xl" size={46}>
        KC
      </Avatar>
    </Stack>
  );
}
