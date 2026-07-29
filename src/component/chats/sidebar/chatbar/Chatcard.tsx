import { Avatar, Badge, Group, Paper, Stack, Text } from "@mantine/core";

interface ChatCardProps {
  name: string;
  message: string;
  avatar: string;
  unreadCount?: number;
  active?: boolean;
  onClick?: () => void;
}

export default function Chatcard({
  name,
  message,
  avatar,
  unreadCount = 0,
  active = false,
  onClick,
}: ChatCardProps) {
  return (
    <Paper
      p="sm"
      radius="md"
      withBorder={active}
      onClick={onClick}
      style={{
        cursor: "pointer",
        background: active ? "var(--mantine-color-blue-light)" : undefined,
        transition: "all 150ms ease",
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group wrap="nowrap" flex={1}>
          <Avatar src={avatar} radius="xl" size={48} />

          <Stack gap={2} flex={1}>
            <Text fw={600} lineClamp={1}>
              {name}
            </Text>

            <Text size="sm" c="dimmed" lineClamp={1}>
              {message}
            </Text>
          </Stack>
        </Group>

        {unreadCount > 0 && (
          <Badge color="blue" radius="xl" variant="filled" size="md">
            {unreadCount}
          </Badge>
        )}
      </Group>
    </Paper>
  );
}
