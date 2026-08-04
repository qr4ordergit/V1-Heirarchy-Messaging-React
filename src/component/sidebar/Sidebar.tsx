import { Avatar, Stack } from "@mantine/core";
import SidebarItem from "./SidebarItem";
import { navigationItems } from "../../utils/navigation";

export default function Sidebar() {
  return (
    <Stack h="100%" justify="space-between" align="center" py="md" bg="var(--mantine-color-blue-1)">
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

      <Avatar radius="xl" size={46}>
        KC
      </Avatar>
    </Stack>
  );
}
