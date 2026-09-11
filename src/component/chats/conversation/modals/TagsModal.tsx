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
import { useTranslation } from "../../../../store/language/language.store";

function TagsModal() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { tagsWithCategories } = useTagStore((state) => state);
  const { updateTagStatus } = useChatStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { target_user } = useAuthStore((state) => state);
  const { translation } = useTranslation();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [oldTags, setOldTags] = useState<string[]>([]);

  const [submitLoader, SubmitFn] = useTransition();
  const [fetchLoader, FetchFn] = useTransition();

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

      const res = await api.post(ENDPOINTS.TAGS_TO_MSG.POST, payload, {
        params: {
          target_user: target_user ? target_user : undefined,
        },
      });

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
      const res = await api.get(ENDPOINTS.TAGS_TO_MSG.EXISTING, {
        params: {
          scope_id: encodeURIComponent(chatId),
          message_id: triggerPayload?._id,
          target_user: target_user ? target_user : undefined,
        },
      });

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
            params: {
              target_user: target_user ? target_user : undefined,
            },
            data: {
              for: chatId?.includes("group") ? "GROUP" : "DM",
              tag_id: tag,
              message_id: [triggerPayload?._id],
            },
          };

          api.delete(ENDPOINTS.TAGS_TO_MSG.DELETE, payload);
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
      title={translation("chat_historymodal-tag-title", "Add Tags to message")}
    >
      <Stack gap="md">
        {fetchLoader ? (
          <Group>
            <Loader size={"sm"} />
            <Text>
              {translation(
                "chat_historymodal-tag-loader-text",
                "Fetching exisiting applied tags",
              )}
            </Text>
          </Group>
        ) : (
          <>
            {chatId?.includes("group") && (
              <Checkbox.Group
                value={selectedTags}
                onChange={setSelectedTags}
                label={translation(
                  "chat_historymodal-tag-label1",
                  "Default group tags",
                )}
              >
                {tagsWithCategories.group?.length ? (
                  <ScrollArea
                    h={Math.min(tagsWithCategories.group?.length * 30, 150)}
                  >
                    <Stack gap="sm">
                      {tagsWithCategories?.group.map((tag) => (
                        <Checkbox key={tag} value={tag} label={tag} />
                      ))}
                    </Stack>
                  </ScrollArea>
                ) : (
                  <Text size="sm" className="text-red-500">
                    {translation(
                      "chat_historymodal-tag-empty1",
                      "Tags not available",
                    )}
                  </Text>
                )}
              </Checkbox.Group>
            )}
            <Checkbox.Group
              value={selectedTags}
              onChange={setSelectedTags}
              label={translation(
                "chat_historymodal-tag-label2",
                "Tags created by you",
              )}
            >
              {tagsWithCategories.user?.length ? (
                <ScrollArea
                  h={Math.min(tagsWithCategories.user?.length * 30, 150)}
                >
                  <Stack gap="sm">
                    {tagsWithCategories?.user.map((tag) => (
                      <Checkbox key={tag} value={tag} label={tag} />
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <Text variant="danger">
                  {translation(
                    "chat_historymodal-tag-empty2",
                    "Tags not available",
                  )}
                </Text>
              )}
            </Checkbox.Group>
          </>
        )}

        <Group justify="flex-end">
          <Button
            onClick={handleAdd}
            loading={submitLoader}
            loaderProps={{ type: "dots" }}
          >
            {translation("chat_historymodal-tag-addBtn", "Add")}
          </Button>
          <Button
            onClick={removeAll}
            loading={submitLoader}
            disabled={oldTags.length === 0}
            loaderProps={{ type: "dots" }}
            variant="outline"
          >
            {translation("chat_historymodal-tag-removeBtn", "Remove all")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default TagsModal;
