import { Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { NavLink } from "react-router";
import { navigationItems } from "../../utils/navigation";

export default function BottomBar() {
  return (
    <Group
      justify="space-around"
      h="100%"
      wrap="nowrap"
      bg="var(--mantine-color-blue-1)"
    >
      {navigationItems.map(({ label, icon: Icon, to }) => (
        <NavLink key={to} to={to}>
          {({ isActive }) => (
            <UnstyledButton
              style={{
                width: 72,
                borderRadius: 12,
                padding: "6px 8px",
              }}
            >
              <Stack gap={2} align="center">
                <Icon
                  size={22}
                  color={isActive ? "var(--mantine-color-blue-9)" : "black"}
                />

                <Text
                  size="xs"
                  fw={isActive ? 600 : 500}
                  c={isActive ? "var(--mantine-color-blue-9)" : "black"}
                >
                  {label}
                </Text>
              </Stack>
            </UnstyledButton>
          )}
        </NavLink>
      ))}
    </Group>
  );
}
