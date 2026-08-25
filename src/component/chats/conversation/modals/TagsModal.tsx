import { useEffect, useState, useTransition } from "react";
import {
  Button,
  Checkbox,
  Group,
  Loader,
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
  const [oldTags, setOldTags] = useState<string[]>([]);

  const [submitLoader, SubmitFn] = useTransition();
  const [fetchLoader, FetchFn] = useTransition();

  const target_user_param = targetUserDetails?.user_id
    ? `target_user=${targetUserDetails.user_id}`
    : "";

  const onClose = () => {
    setSelectedTags([]);
    resetTrigger();
  };

  const onAdd = async () => {
    if (selectedTags.length < 1) return;

    try {
      const payload = {
        for: chatId?.includes("group") ? "GROUP" : "DM",
        tag_id: selectedTags,
        message_id: [triggerPayload?._id],
      };

      const res = await api.post(
        `${ENDPOINTS.TAGS.POST}?${target_user_param}`,
        payload,
      );

      if (!res.data?.success) {
        Notification.error("Something went wrong");
        return;
      }
      updateTagStatus({
        message_ids: [triggerPayload?._id ?? ""],
        status: true,
      });

      const olddyTags = oldTags.filter((tag) => !selectedTags.includes(tag));
      await removeTags(olddyTags);

      Notification.success("Tags added successfully");
      onClose();
    } catch (error) {
      Notification.error("Something went wrong");
    }
  };

  const handleAdd = () => {
    SubmitFn(onAdd);
  };

  const fetchExisitingTags = async () => {
    if (!chatId) return;

    try {
      const res = await api.get(
        `${ENDPOINTS.TAGS.EXISTING}?scope_id=${encodeURIComponent(chatId)}&message_id=${triggerPayload?._id}&${target_user_param}`,
      );

      if (res.data?.success) {
        setSelectedTags(res.data?.document_tagged_in);
        setOldTags(res.data?.document_tagged_in);
      }
    } catch (error) {}
  };

  const removeTags = async (toRemoveTags: string[]) => {
    if (toRemoveTags.length === 0) return;

    try {
      Promise.all(
        toRemoveTags.map((tag) => {
          const payload: { [key: string]: unknown } = {
            data: {
              for: chatId?.includes("group") ? "GROUP" : "DM",
              tag_id: tag,
              message_id: [triggerPayload?._id],
            },
          };

          api.delete(`${ENDPOINTS.TAGS.DELETE}?${target_user_param}`, payload);
        }),
      );
    } catch (error) {}
  };

  const removeAll = () => {
    SubmitFn(async () => {
      await removeTags(oldTags);
      Notification.success("Tags removed successfully");
      updateTagStatus({
        message_ids: [triggerPayload?._id ?? ""],
        status: false,
      });
      onClose();
    });
  };

  useEffect(() => {
    if (trigger === TRIGGERS.tagList) {
      FetchFn(fetchExisitingTags);
    }
  }, [trigger]);

  return (
    <Modal
      opened={trigger === TRIGGERS.tagList}
      onClose={onClose}
      title="Add Tags to message"
    >
      <Stack gap="md">
        {fetchLoader ? (
          <Group>
            <Loader size={"sm"} />
            <Text>Fetching exisiting applied tags</Text>
          </Group>
        ) : (
          <>
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
          </>
        )}

        <Group justify="flex-end">
          <Button
            onClick={handleAdd}
            loading={submitLoader}
            loaderProps={{ type: "dots" }}
          >
            Add
          </Button>
          <Button
            onClick={removeAll}
            loading={submitLoader}
            disabled={oldTags.length === 0}
            loaderProps={{ type: "dots" }}
            variant="outline"
          >
            Remove all
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default TagsModal;
