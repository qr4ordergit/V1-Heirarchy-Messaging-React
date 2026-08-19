import { ActionIcon, Badge, Paper, TextInput } from "@mantine/core";
import { IconFilter2X, IconStarFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";
import { useChatStore } from "../../../store/chats/chats.store";

export default function TextFilterInputBox() {
  const [message, setMessage] = useState<string>("");
  const { setTrigger, triggerPayload, trigger } = useTriggerStore(
    (state) => state,
  );
  const { filterChatsByText, emptyOGList, ogChats } = useChatStore(
    (state) => state,
  );

  const resetFilter = () => {
    if (ogChats.length > 0) {
      emptyOGList();
    }
    setTrigger({
      toTrigger: TRIGGERS.refreshChat,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      filterChatsByText(message);
    }, 300);

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <Paper shadow="xs" radius="xl" p="xs" className="border border-blue-700">
      {trigger === TRIGGERS.searchByTag && (
        <Badge className="mb-1" leftSection={<IconStarFilled size={12} />}>
          {triggerPayload?.tag}
        </Badge>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <ActionIcon
          variant="subtle"
          radius="xl"
          size={36}
          aria-label="Attach files"
          onClick={resetFilter}
        >
          <IconFilter2X size={20} stroke={2} />
        </ActionIcon>

        <div style={{ flex: 1 }}>
          <TextInput
            placeholder="Type to filter..."
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
            autoFocus
          />
        </div>
      </div>
    </Paper>
  );
}
