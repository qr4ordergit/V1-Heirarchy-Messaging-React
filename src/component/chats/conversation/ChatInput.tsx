import {
  ActionIcon,
  Badge,
  FileButton,
  Group,
  Loader,
  Paper,
  Text,
  TextInput,
} from "@mantine/core";
import { IconLock, IconPaperclip, IconSend, IconX } from "@tabler/icons-react";
import { useEffect, useState, useTransition } from "react";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { Notification } from "../../../utils/notification";
import { useParams } from "react-router";
import { useNextPerson } from "../../../hooks/useNextPerson";
import { useChatStore } from "../../../store/chats/chats.store";
import axios from "axios";
import ReplyInputBoxCard from "./ReplyInputBoxCard";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";
import { useAuthStore } from "../../../store/auth/auth.store";

interface SUBMIT_PAYLOAD {
  [key: string]: unknown;
}

export default function ChatInput() {
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const appendChats = useChatStore((state) => state.appendChats);
  const { trigger, triggerPayload, resetTrigger, setTrigger } =
    useTriggerStore();
  const userDetails = useAuthStore((state) => state.userDetails);

  const isReply = trigger === TRIGGERS.reply;
  const isGroup = chatId?.includes("group");

  const [message, setMessage] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  const [submitLoader, SubmitFn] = useTransition();

  const handleFiles = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!chatId) return;

    try {
      const payload: SUBMIT_PAYLOAD = {
        user: isGroup ? undefined : nextPerson(chatId),
        group_id: isGroup ? chatId : undefined,
        type: isReply ? "replay" : "message",
        parent_message_id: triggerPayload?._id ?? undefined,
        text: message,
      };

      if (trigger === TRIGGERS.privateMessageSender) {
        payload["user_key"] = triggerPayload?.password;
        if (triggerPayload?.users && triggerPayload?.users?.length > 0) {
          payload["users_list"] = [
            ...triggerPayload?.users,
            userDetails?.username,
          ];
        }
      }

      const endpoint = isGroup
        ? ENDPOINTS.GROUP_CHAT.POST
        : ENDPOINTS.CHAT.SEND;

      const response = await api.post(endpoint, payload);

      if (!response.data?.success) {
        Notification.error("Something went wrong");
        return;
      }
      let finalMsg = response.data?.data;
      finalMsg["double_encryption"] = false;
      appendChats([finalMsg]);
      if (isReply) {
        resetTrigger();
      }
      setMessage("");
    } catch (error) {
      console.log(error);
      Notification.error("Something went wrong");
    }
  };

  const sendWithAttachments = async () => {
    if (!chatId) return;

    try {
      const payload: SUBMIT_PAYLOAD = {
        user: isGroup ? undefined : nextPerson(chatId),
        group_id: isGroup ? chatId : undefined,
        type: isReply ? "replay" : "message",
        parent_message_id: triggerPayload?._id ?? undefined,
        text: message,
        files: files.map((file) => file.name),
      };

      if (trigger === TRIGGERS.privateMessageSender) {
        payload["user_key"] = triggerPayload?.password;
        if (triggerPayload?.users && triggerPayload?.users?.length > 0) {
          payload["users_list"] = [
            ...triggerPayload?.users,
            userDetails?.username,
          ];
        }
      }

      const endpoint = isGroup
        ? ENDPOINTS.GROUP_CHAT.POST
        : ENDPOINTS.CHAT.SEND;
      const response = await api.post(endpoint, payload);

      if (!response.data?.success) {
        Notification.error("Something went wrong");
        return;
      }

      if (!response.data?.upload_urls) {
        return Notification.error("Something went wrong");
      }

      let urls = response.data?.upload_urls ?? [];

      for (let i = 0; i < urls.length; i++) {
        await axios.put(urls[i].upload_url, files[i], {
          headers: {
            "Content-Type": files[i].type,
          },
        });
      }

      let finalMsg = response.data?.data;
      finalMsg["double_encryption"] = false;
      appendChats([finalMsg]);
      if (isReply) {
        resetTrigger();
      }
      setMessage("");
      setFiles([]);
    } catch (error) {
      console.log(error);
      Notification.error("Something went wrong");
    }
  };

  const handleSubmit = () => {
    if (trigger === TRIGGERS.isPrivate) {
      setTrigger({
        toTrigger: TRIGGERS.privateMessageModal,
      });

      return;
    }

    if (files.length > 0) {
      SubmitFn(sendWithAttachments);
    } else {
      SubmitFn(sendMessage);
    }
  };

  const togglePrivate = () => {
    if (trigger !== TRIGGERS.isPrivate) {
      setTrigger({
        toTrigger: TRIGGERS.isPrivate,
      });
    } else {
      resetTrigger();
    }
  };

  const triggerHandler = () => {
    switch (trigger) {
      case TRIGGERS.privateMessageSender:
        handleSubmit();
        break;
    }
  };

  useEffect(() => {
    triggerHandler();
  }, [trigger]);

  return (
    <Paper shadow="xs" radius="xl" p="xs" withBorder>
      {/* Replay */}
      <ReplyInputBoxCard />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {chatId?.includes("group") && (
          <ActionIcon
            variant={trigger.includes("secret_007") ? "filled" : "subtle"}
            radius="xl"
            size={36}
            onClick={togglePrivate}
          >
            <IconLock size={20} stroke={2} />
          </ActionIcon>
        )}

        {/* Attachment */}
        <FileButton onChange={handleFiles} multiple disabled={submitLoader}>
          {(props) => (
            <ActionIcon
              {...props}
              variant="subtle"
              radius="xl"
              size={36}
              aria-label="Attach files"
            >
              <IconPaperclip size={20} stroke={2} />
            </ActionIcon>
          )}
        </FileButton>

        {/* Message + selected files */}
        <div style={{ flex: 1 }}>
          {files.length > 0 && (
            <Group gap={6} mb={6} px={4}>
              <Badge variant="light" leftSection={<IconPaperclip size={13} />}>
                {files.length} {files.length === 1 ? "file" : "files"} selected
              </Badge>

              {files.map((file, index) => (
                <Badge
                  key={`${file.name}-${index}`}
                  variant="outline"
                  rightSection={
                    <IconX
                      size={12}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeFile(index)}
                    />
                  }
                >
                  <Text size="xs" maw={120} truncate>
                    {file.name}
                  </Text>
                </Badge>
              ))}
            </Group>
          )}

          <TextInput
            placeholder="Type a message..."
            variant="unstyled"
            styles={{
              input: {
                borderRadius: 999,
                padding: "10px 16px",
                backgroundColor: "var(--mantine-color-gray-0)",
              },
            }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            readOnly={submitLoader}
          />
        </div>

        {/* Send */}
        <ActionIcon
          variant="filled"
          radius="xl"
          size={36}
          aria-label="Send message"
          onClick={handleSubmit}
          disabled={submitLoader || (!message.trim() && files.length === 0)}
        >
          {submitLoader ? (
            <Loader size={20} />
          ) : (
            <IconSend size={18} stroke={2} />
          )}
        </ActionIcon>
      </div>
    </Paper>
  );
}
