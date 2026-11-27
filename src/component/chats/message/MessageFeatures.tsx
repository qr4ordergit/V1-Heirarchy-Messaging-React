import { Flex, Group, Text } from "@mantine/core";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { Fragment } from "react/jsx-runtime";
import { MediaChat } from "../conversation/MediaChat";
import MediaDownload from "../conversation/MediaDownload";
import { IconCaretDownFilled, IconStarFilled } from "@tabler/icons-react";
import { ChatOptions } from "../conversation/ChatOptions";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import ReplyChat from "../conversation/ReplyChat";

dayjs.extend(utc);

interface MESG_FEATURE {
  msg: MESSAGE;
  onReplyClick: (messageId: string) => void;
}

function MessageFeatures({ msg, onReplyClick }: MESG_FEATURE) {
  return (
    <div>
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
        c={"white"}
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {msg.body?.text}
      </Text>

      <Group justify="flex-end" className="items-center" gap={4} mt={6}>
        {msg?.is_tagged ? <IconStarFilled size={12} color="#e2e2e2" /> : ""}

        <Text size="xs" c={"gray.2"}>
          {dayjs.utc(msg.created_on).local().format("hh:mm A")}
        </Text>
      </Group>
      <ChatOptions msg={msg}>
        <div className="absolute top-1 right-1 cursor-pointer">
          <IconCaretDownFilled className="text-gray-300" size={18} />
        </div>
      </ChatOptions>
    </div>
  );
}

export default MessageFeatures;
