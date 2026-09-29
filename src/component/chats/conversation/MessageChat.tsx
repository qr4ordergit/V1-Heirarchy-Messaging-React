import { Flex, Group, Paper, Text } from "@mantine/core";
import {
  IconCaretDownFilled,
  IconChecks,
  IconStarFilled,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { useAuthStore } from "../../../store/auth/auth.store";
import { MediaChat } from "./MediaChat";
import { ChatOptions } from "./ChatOptions";
import ReplyChat from "./ReplyChat";
import useContactNameProvider from "../../../hooks/useContactNameProvider";
import MediaDownload from "./MediaDownload";
import { Fragment } from "react/jsx-runtime";

dayjs.extend(utc);

interface MessageChatProps {
  msg: MESSAGE;
  onReplyClick: (messageId: string) => void;
}

export function MessageChat({ msg, onReplyClick }: MessageChatProps) {
  const { userDetails, targetUserDetails } = useAuthStore((state) => state);

  const own_user_id = targetUserDetails?.user_id ?? userDetails?.username;
  const isMe = own_user_id === msg.created_by;

  const contactNameProvider = useContactNameProvider();

  return (
    <Group
      justify={isMe ? "flex-end" : "flex-start"}
      align="flex-end"
      wrap="nowrap"
      data-message-id={msg._id}
    >
      <Paper
        shadow="xs"
        radius="lg"
        p="md"
        maw="70%"
        bg={isMe ? "blue.6" : "white"}
        className="relative"
      >
        {!isMe && (
          <Text size="xs" fw={600} c="blue" mb={4}>
            {contactNameProvider(msg.created_by ?? "")}
          </Text>
        )}

        {msg?.replied_to && (
          <ReplyChat replied_to={msg.replied_to} onReplyClick={onReplyClick} />
        )}

        {msg?.body?.media ? (
          <Flex gap={6} justify={"center"} wrap={"wrap"}>
            {msg.body?.media?.map((media_data, i) => (
              <Fragment key={i}>
                {media_data.media_details.isDecrypted ? (
                  <MediaChat media_data={media_data} />
                ) : (
                  <MediaDownload
                    msg_id={msg._id || ""}
                    media_data={media_data}
                    mediaIndex={i}
                  />
                )}
              </Fragment>
            ))}
          </Flex>
        ) : null}

        <Text
          c={isMe ? "white" : "dark"}
          style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {msg.body?.text}
        </Text>

        <Group justify="flex-end" className="items-center" gap={4} mt={6}>
          {msg?.is_tagged ? <IconStarFilled size={12} color="#e2e2e2" /> : ""}

          <Text size="xs" c={isMe ? "gray.2" : "dimmed"}>
            {dayjs.utc(msg.created_on).local().format("hh:mm A")}
          </Text>

          <IconChecks size={14} color="#9be7ff" />
        </Group>
        <ChatOptions msg={msg}>
          <div className="absolute top-1 right-1 cursor-pointer">
            <IconCaretDownFilled className="text-gray-300" size={18} />
          </div>
        </ChatOptions>
      </Paper>
    </Group>
  );
}
