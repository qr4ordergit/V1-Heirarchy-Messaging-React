import { Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { IconCheck, IconChecks } from "@tabler/icons-react";

const messages = [
  {
    id: 1,
    sender: "other",
    name: "John",
    avatar: "https://i.pravatar.cc/150?img=3",
    message: "Hey! How's the React project going?",
    time: "10:24 AM",
  },
  {
    id: 2,
    sender: "me",
    message:
      "Going great! I'm currently building the chat interface using Mantine UI.",
    time: "10:25 AM",
    read: true,
  },
  {
    id: 3,
    sender: "other",
    name: "John",
    avatar: "https://i.pravatar.cc/150?img=3",
    message:
      "Nice! Mantine has some really good components. Don't forget to use ScrollArea.",
    time: "10:26 AM",
  },
  {
    id: 4,
    sender: "me",
    message: "Yep 😄 Almost done.",
    time: "10:27 AM",
    read: false,
  },
];

export default function Chatting() {
  return (
    <ScrollArea h="100%" scrollbarSize={8} offsetScrollbars>
      <Stack py="md" gap="sm">
        {messages.map((msg) => {
          const isMe = msg.sender === "me";

          return (
            <Group
              key={msg.id}
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
                    {msg.name}
                  </Text>
                )}

                <Text
                  c={isMe ? "white" : "dark"}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.message}
                </Text>

                <Group justify="flex-end" gap={4} mt={6}>
                  <Text size="xs" c={isMe ? "gray.2" : "dimmed"}>
                    {msg.time}
                  </Text>

                  {isMe &&
                    (msg.read ? (
                      <IconChecks size={14} color="#9be7ff" />
                    ) : (
                      <IconCheck size={14} color="white" />
                    ))}
                </Group>
              </Paper>
            </Group>
          );
        })}
      </Stack>
    </ScrollArea>
  );
}
