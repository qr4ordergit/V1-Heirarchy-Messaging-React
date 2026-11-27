import { Group, Paper } from "@mantine/core";
import { type ReactNode } from "@tabler/icons-react";

interface MessageChatProps {
  children: ReactNode;
  msgId: string;
}

export function OwnMessageBubble({ children, msgId }: MessageChatProps) {
  return (
    <Group
      justify={"flex-end"}
      align="flex-end"
      wrap="nowrap"
      data-message-id={msgId}
      className="rounded-md"
    >
      <Paper
        shadow="xs"
        radius="lg"
        p="md"
        maw="70%"
        bg={"blue.6"}
        className="relative"
      >
        {children}
      </Paper>
    </Group>
  );
}
