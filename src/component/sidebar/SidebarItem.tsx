import { NavLink } from "react-router";
import { Stack, Text, UnstyledButton } from "@mantine/core";
import type { IconProps } from "@tabler/icons-react";

interface SidebarItemProps {
  label: string;
  to: string;
  Icon: React.ComponentType<IconProps>;
}

export default function SidebarItem({ label, to, Icon }: SidebarItemProps) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <UnstyledButton
          style={{
            width: 64,
            borderRadius: 12,
            color: isActive ? "	var(--mantine-color-blue-9)" : "black",
            padding: "8px 4px",
          }}
        >
          <Stack gap={2} align="center">
            <Icon
              size={22}
              color={isActive ? "	var(--mantine-color-blue-9)" : "black"}
            />

            <Text
              size="xs"
              fw={isActive ? 600 : 500}
              c={isActive ? "	var(--mantine-color-blue-9)" : "black"}
            >
              {label}
            </Text>
          </Stack>
        </UnstyledButton>
      )}
    </NavLink>
  );
}
