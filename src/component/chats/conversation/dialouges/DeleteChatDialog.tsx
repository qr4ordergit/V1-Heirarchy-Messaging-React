import { Button, Dialog, Group, Text } from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { Notification } from "../../../../utils/notification";
import { useTransition } from "react";
import { useChatStore } from "../../../../store/chats/chats.store";
import { useParams } from "react-router";

function DeleteChatDialog() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { popChat } = useChatStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();

  const isGroup = chatId?.includes("group");

  const [deleteLoader, DeleteFn] = useTransition();

  const onClose = () => {
    resetTrigger();
  };

  const onDelete = async () => {
    const messageId = triggerPayload?._id;

    if (!messageId) {
      Notification.error("Unable to delete chat");
      return;
    }
    try {
      const payload = {
        data: {
          message_id: triggerPayload._id,
          soft_delete: true,
        },
      };

      const endpoint = isGroup
        ? ENDPOINTS.GROUP_CHAT.DELETE
        : ENDPOINTS.CHAT.DELETE;
      const res = await api.delete(endpoint, payload);

      if (!res.data?.success) {
        return Notification.error("Unable to delete chat");
      }

      popChat(triggerPayload._id);

      Notification.success("Chat deleted successfully");
      resetTrigger();
    } catch (error) {
      console.log(error);
      Notification.error("Something went wrong");
      resetTrigger();
    }
  };

  return (
    <Dialog
      opened={trigger === TRIGGERS.deleteConfirmationDialouge}
      withCloseButton
      onClose={onClose}
      size="lg"
      position={{ bottom: 20, right: 20 }}
    >
      <Text size="sm" mb="xs" fw={500}>
        Are you sure you want to delete?
      </Text>

      <Group align="flex-end">
        <Button
          loading={deleteLoader}
          loaderProps={{ type: "dots" }}
          onClick={() => DeleteFn(onDelete)}
          color="red"
        >
          Delete
        </Button>
        <Button disabled={deleteLoader} onClick={onClose} color="gray">
          Cancel
        </Button>
      </Group>
    </Dialog>
  );
}

export default DeleteChatDialog;
