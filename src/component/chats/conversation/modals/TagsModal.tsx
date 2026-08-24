import { useState, useTransition } from "react";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { useTagStore } from "../../../../store/tags/tags.store";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { Notification } from "../../../../utils/notification";
import { useChatStore } from "../../../../store/chats/chats.store";
import { useParams } from "react-router";
import { useAuthStore } from "../../../../store/auth/auth.store";

function TagsModal() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { tags } = useTagStore((state) => state);
  const { updateTagStatus } = useChatStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { targetUserDetails } = useAuthStore((state) => state);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [addLoader, AddFn] = useTransition();

  const onClose = () => {
    setSelectedTags([]);
    resetTrigger();
  };

  const onAdd = async () => {
    if (selectedTags.length < 1) return;

    const payload = {
      for: chatId?.includes("group") ? "GROUP" : "DM",
      tag_id: selectedTags,
      message_id: [triggerPayload?._id],
      target_user: targetUserDetails?.user_id,
    };

    const res = await api.post(ENDPOINTS.TAGS.POST, payload);

    if (!res.data?.success) {
      Notification.error("Something went wrong");
      return;
    }
    updateTagStatus([triggerPayload?._id ?? ""]);
    Notification.success("Tags added successfully");
    onClose();
  };

  const handleAdd = () => {
    AddFn(onAdd);
  };

  return (
    <Modal
      opened={trigger === TRIGGERS.tagList}
      onClose={onClose}
      title="Add Tags to message"
    >
      <Stack gap="md">
        {tags.length ? (
          <ScrollArea h={Math.min(tags.length * 36, 200)}>
            <Checkbox.Group value={selectedTags} onChange={setSelectedTags}>
              <Stack gap="sm">
                {tags.map((tag) => (
                  <Checkbox key={tag} value={tag} label={tag} />
                ))}
              </Stack>
            </Checkbox.Group>
          </ScrollArea>
        ) : (
          <Text className="text-red-500">Tags not found</Text>
        )}

        <Group justify="flex-end">
          <Button
            onClick={handleAdd}
            disabled={selectedTags.length === 0}
            loading={addLoader}
            loaderProps={{ type: "dots" }}
          >
            Add
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default TagsModal;
