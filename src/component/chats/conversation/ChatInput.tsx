import { ActionIcon, Paper, TextInput } from "@mantine/core";
import { IconPaperclip, IconSend } from "@tabler/icons-react";

export default function ChatInput() {
  return (
    <Paper
      shadow="xs"
      radius="xl"
      p="xs"
      withBorder
      style={{
        display: "flex",
        alignItems: "end",
        gap: 8,
      }}
    >
      <ActionIcon
        variant="light"
        radius="xl"
        size={36}
        aria-label="Attach file"
      >
        <IconPaperclip size={18} stroke={2} />
      </ActionIcon>
      <div className="w-full">
        <div></div>
        <TextInput
          placeholder="Type a message..."
          variant="unstyled"
          style={{ flex: 1 }}
          styles={{
            input: {
              borderRadius: 999,
              padding: "10px 16px",
              backgroundColor: "var(--mantine-color-gray-0)",
            },
          }}
        />
      </div>

      <ActionIcon
        variant="filled"
        radius="xl"
        size={36}
        aria-label="Send message"
      >
        <IconSend size={18} stroke={2} />
      </ActionIcon>
    </Paper>
  );
}
