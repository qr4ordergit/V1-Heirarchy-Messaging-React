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
import { IconPaperclip, IconSend, IconX } from "@tabler/icons-react";
import { useState, useTransition } from "react";
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

export default function ChatInput() {
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const appendChats = useChatStore((state) => state.appendChats);
  const { trigger, triggerPayload, resetTrigger } = useTriggerStore();

  const isReply = trigger === TRIGGERS.reply;

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

    const payload = {
      user: nextPerson(chatId),
      type: isReply ? "replay" : "message",
      parent_message_id: triggerPayload?._id ?? undefined,
      text: message,
    };

    const response = await api.post(ENDPOINTS.CHAT.SEND, payload);

    if (!response.data?.success) {
      Notification.error("Something went wrong");
      return;
    }

    appendChats([response.data?.data]);
    if (isReply) {
      resetTrigger();
    }
    setMessage("");
  };

  const sendWithAttachments = async () => {
    if (!chatId) return;

    const payload = {
      user: nextPerson(chatId),
      type: isReply ? "replay" : "message",
      parent_message_id: triggerPayload?._id ?? undefined,
      text: message,
      files: files.map((file) => file.name),
    };

    const response = await api.post(ENDPOINTS.CHAT.SEND, payload);

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

    appendChats([response.data?.data]);
    if (isReply) {
      resetTrigger();
    }
    setMessage("");
    setFiles([]);
  };

  const handleSubmit = () => {
    if (files.length > 0) {
      SubmitFn(sendWithAttachments);
    } else {
      SubmitFn(sendMessage);
    }
  };

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
