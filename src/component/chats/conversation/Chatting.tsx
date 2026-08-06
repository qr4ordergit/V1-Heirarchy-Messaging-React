import { Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { IconCheck, IconChecks } from "@tabler/icons-react";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { useEffect, useState, useTransition } from "react";
import dayjs from "dayjs";
import { ConversationShimmer } from "../../loaders/shimmers/ConversationShimmer";

interface MESSAGE {
  _id: string;
  created_by: string;
  created_on: string;
  body: {
    text: string;
  };
}

export default function Chatting() {
  const [messages, setMessages] = useState([]);

  const [fetchLoader, FetchFn] = useTransition();

  const fetchChats = async () => {
    const response = await api.get(`${ENDPOINTS.CHAT.GET}${"sup-aveer02"}`);

    if (!response.data?.success) return;

    setMessages(response.data?.data?.messages ?? []);
  };

  useEffect(() => {
    FetchFn(fetchChats);
  }, []);

  if (fetchLoader) return <ConversationShimmer />;

  return (
    <ScrollArea h={"100%"} scrollbarSize={8} offsetScrollbars className="py-2">
      <Stack py="md" gap="sm" className="h-100">
        {messages.map((msg: MESSAGE) => {
          const isMe = "me";

          return (
            <Group
              key={msg._id}
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

                <Text
                  c={isMe ? "white" : "dark"}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.body?.text}
                </Text>

                <Group justify="flex-end" gap={4} mt={6}>
                  <Text size="xs" c={isMe ? "gray.2" : "dimmed"}>
                    {dayjs(msg.created_on).format("hh:mm A")}
                  </Text>

                  {isMe &&
                    (true ? (
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
