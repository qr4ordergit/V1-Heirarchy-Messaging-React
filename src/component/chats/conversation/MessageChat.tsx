import { Group, Paper, Text } from "@mantine/core";
import { IconChecks, IconStarFilled } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { useAuthStore } from "../../../store/auth/auth.store";
import { MediaChat } from "./MediaChat";
import { ChatOptions } from "./ChatOptions";
import ReplyChat from "./ReplyChat";
import { chatCardColorProvider } from "../../../utils/chatCardColorProvider";

interface MessageChatProps {
  msg: MESSAGE;
  onReplyClick: (messageId: string) => void;
}

export function MessageChat({ msg, onReplyClick }: MessageChatProps) {
  const userDetails = useAuthStore((state) => state.userDetails);

  const isMe = userDetails?.username === msg.created_by;
  return (
    <Group
      justify={isMe ? "flex-end" : "flex-start"}
      align="flex-end"
      wrap="nowrap"
      data-message-id={msg._id}
    >
      <ChatOptions msg={msg}>
        <Paper
          shadow="xs"
          radius="lg"
          p="sm"
          maw="70%"
          bg={chatCardColorProvider(isMe)}
        >
          {!isMe && (
            <Text size="xs" fw={600} c="blue" mb={4}>
              {msg.created_by}
            </Text>
          )}

          {msg?.replied_to && (
            <ReplyChat
              replied_to={msg.replied_to}
              onReplyClick={onReplyClick}
            />
          )}

          {msg.body?.media_url
            ? msg.body?.media_url?.map((url) => (
                <MediaChat key={url} url={url} msg={msg} />
              ))
            : ""}

          <Text
            c={isMe ? "white" : "dark"}
            style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          >
            {msg.body?.text}
          </Text>

          <Group justify="flex-end" className="items-center" gap={4} mt={6}>
            {msg?.is_tagged ? <IconStarFilled size={12} color="#e2e2e2" /> : ""}

            <Text size="xs" c={isMe ? "gray.2" : "dimmed"}>
              {dayjs(msg.created_on).format("hh:mm A")}
            </Text>

            <IconChecks size={14} color="#9be7ff" />
          </Group>
        </Paper>
      </ChatOptions>
    </Group>
  );
}
