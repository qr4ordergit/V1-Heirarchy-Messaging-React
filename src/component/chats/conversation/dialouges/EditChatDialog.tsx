import { Button, Dialog, Group, TextInput } from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { Notification } from "../../../../utils/notification";
import { useEffect, useState, useTransition } from "react";
import { useChatStore } from "../../../../store/chats/chats.store";
import { useNextPerson } from "../../../../hooks/useNextPerson";
import { useParams } from "react-router";

function EditChatDialog() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { alterChat } = useChatStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();

  const isGroup = chatId?.includes("group");

  const [message, setMessage] = useState<string>("");

  const [editLoader, EditFn] = useTransition();

  const onClose = () => {
    resetTrigger();
  };

  const onEdit = async () => {
    if (message.trim() === triggerPayload?.body?.text) {
      resetTrigger();
      return;
    }

    if (!chatId) return;

    const payload = {
      user: isGroup ? undefined : nextPerson(chatId),
      body: { text: message },
      message_id: triggerPayload?._id,
    };

    const endpoint = isGroup ? ENDPOINTS.GROUP_CHAT.PUT : ENDPOINTS.CHAT.PUT;
    const res = await api.put(endpoint, payload);

    if (!res.data?.success) {
      return Notification.error("Unable to edit chat");
    }

    alterChat(triggerPayload?._id ?? "", message);
    resetTrigger();
  };

  const dataAssigner = () => {
    if (trigger !== TRIGGERS.editChatDialog) return;

    setMessage(triggerPayload?.body?.text ?? "");
  };

  useEffect(() => {
    dataAssigner();
  }, [trigger]);

  return (
    <Dialog
      opened={trigger === TRIGGERS.editChatDialog}
      withCloseButton
      onClose={onClose}
      size="lg"
      position={{ bottom: "40%", right: "20%" }}
    >
      <TextInput
        autoFocus
        label="Enter new message"
        placeholder="Enter text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        readOnly={editLoader}
      />
      <Group justify="center" mt="md">
        <Button
          loading={editLoader}
          loaderProps={{ type: "dots" }}
          onClick={() => EditFn(onEdit)}
        >
          Update
        </Button>
      </Group>
    </Dialog>
  );
}

export default EditChatDialog;
