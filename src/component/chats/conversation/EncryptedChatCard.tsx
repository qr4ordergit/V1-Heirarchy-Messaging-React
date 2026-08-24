import { Card, Group } from "@mantine/core";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { useAuthStore } from "../../../store/auth/auth.store";
import { IconLock } from "@tabler/icons-react";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";

interface props {
  msg: MESSAGE;
}

function EncryptedChatCard({ msg }: props) {
  const { userDetails, targetUserDetails } = useAuthStore((state) => state);
  const { setTrigger } = useTriggerStore((state) => state);

  const own_user_id = targetUserDetails?.user_id ?? userDetails?.username;
  const isMe = own_user_id === msg.created_by;

  const onDecrypt = () => {
    setTrigger({
      toTrigger: TRIGGERS.decryptPrivateMsgDialog,
      payload: {
        _id: msg._id,
      },
    });
  };

  return (
    <Group
      justify={isMe ? "flex-end" : "flex-start"}
      align="flex-end"
      wrap="nowrap"
      data-message-id={msg._id}
    >
      <Card
        withBorder
        bg={isMe ? "blue.6" : "white"}
        className="text-white cursor-pointer"
        onDoubleClick={onDecrypt}
      >
        <div
          className={`h-25 flex flex-col justify-center items-center ${isMe ? "text-white" : "text-dark"}`}
        >
          <IconLock />
          <div>Double click to decrypt content</div>
        </div>
      </Card>
    </Group>
  );
}

export default EncryptedChatCard;
