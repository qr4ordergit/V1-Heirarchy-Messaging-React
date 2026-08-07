import { ActionIcon, Loader, Paper, TextInput } from "@mantine/core";
import { IconPaperclip, IconSend } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { Notification } from "../../../utils/notification";
import { useParams } from "react-router";
import { useNextPerson } from "../../../hooks/useNextPerson";
import { useChatStore } from "../../../store/chats/chats.store";

export default function ChatInput() {
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const appendChats = useChatStore((state) => state.appendChats);

  const [message, setMessage] = useState<string>("");

  const [submitLoader, SubmitFn] = useTransition();

  const sendMessage = async () => {
    if (!chatId) return;

    const payload = {
      user: nextPerson(chatId),
      type: "message",
      text: message,
    };

    const response = await api.post(ENDPOINTS.CHAT.SEND, payload);

    if (!response.data?.success) {
      Notification.error("Something went wrong");
      return;
    }

    appendChats([response.data?.data]);
    setMessage("");
  };

  const handleSubmit = () => {
    SubmitFn(sendMessage);
  };

  return (
    <Paper
      shadow="xs"
      radius="xl"
      p="xs"
      withBorder
      style={{
        display: "flex",
        alignItems: "end",
        gap: 8,
      }}
    >
      <ActionIcon
        variant="light"
        radius="xl"
        size={36}
        aria-label="Attach file"
      >
        <IconPaperclip size={18} stroke={2} />
      </ActionIcon>
      <div className="w-full">
        <div></div>
        <TextInput
          placeholder="Type a message..."
          variant="unstyled"
          style={{ flex: 1 }}
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

      <ActionIcon
        variant="filled"
        radius="xl"
        size={36}
        aria-label="Send message"
        onClick={handleSubmit}
        disabled={submitLoader}
      >
        {submitLoader ? (
          <Loader size={30} />
        ) : (
          <IconSend size={18} stroke={2} />
        )}
      </ActionIcon>
    </Paper>
  );
}
