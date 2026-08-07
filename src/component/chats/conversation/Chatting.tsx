import { Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { IconCheck, IconChecks } from "@tabler/icons-react";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { useEffect, useTransition } from "react";
import dayjs from "dayjs";
import { ConversationShimmer } from "../../loaders/shimmers/ConversationShimmer";
import { Notification } from "../../../utils/notification";
import { useChatStore } from "../../../store/chats/chats.store";
import { useParams } from "react-router";
import { useNextPerson } from "../../../hooks/useNextPerson";

export default function Chatting() {
  const messages = useChatStore((state) => state.chats);
  const addChats = useChatStore((state) => state.addChats);
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();

  const [fetchLoader, FetchFn] = useTransition();

  const fetchOneToOneChats = async () => {
    if (!chatId) return;

    const response = await api.get(
      `${ENDPOINTS.CHAT.GET}${nextPerson(chatId)}`,
    );

    if (!response.data?.success) {
      Notification.error("Something went wrong");
      return;
    }

    addChats(response.data?.data?.messages ?? []);
  };

  const fetchChats = () => {
    FetchFn(fetchOneToOneChats);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  if (fetchLoader) return <ConversationShimmer />;

  return (
    <ScrollArea h={"100%"} scrollbarSize={8} offsetScrollbars className="py-2">
      <Stack py="md" gap="sm" className="h-100">
        {messages.map((msg) => {
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
