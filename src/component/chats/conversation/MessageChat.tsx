import { Group, Paper, Text } from "@mantine/core";
import { IconChecks } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { useAuthStore } from "../../../store/auth/auth.store";

interface MessageChatProps {
  msg: MESSAGE;
}

export function MessageChat({ msg }: MessageChatProps) {
  const userDetails = useAuthStore((state) => state.userDetails);

  const isMe = userDetails?.username === msg.created_by;
  return (
    <Group
      justify={isMe ? "flex-end" : "flex-start"}
      align="flex-end"
      wrap="nowrap"
    >
      <Paper
        shadow="xs"
        radius="lg"
        p="sm"
        maw="70%"
        withBorder
        bg={isMe ? "blue.6" : "white"}
      >
        {!isMe && (
          <Text size="xs" fw={600} c="blue" mb={4}>
            {msg.created_by}
          </Text>
        )}

        <Text c={isMe ? "white" : "dark"} style={{ whiteSpace: "pre-wrap" }}>
          {msg.body?.text}
        </Text>

        <Group justify="flex-end" gap={4} mt={6}>
          <Text size="xs" c={isMe ? "gray.2" : "dimmed"}>
            {dayjs(msg.created_on).format("hh:mm A")}
          </Text>

          <IconChecks size={14} color="#9be7ff" />
        </Group>
      </Paper>
    </Group>
  );
}
