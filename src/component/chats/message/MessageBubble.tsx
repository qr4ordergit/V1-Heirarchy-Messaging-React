import { IconUser, type ReactNode } from "@tabler/icons-react";
import "./MessageBubble.css";
import useContactNameProvider from "../../../hooks/useContactNameProvider";
import { Text } from "@mantine/core";
import { useParams } from "react-router";

interface MSG_BUBBLE {
  children: ReactNode;
  createdBy: string;
  msgId: string;
}

function MessageBubble({ children, createdBy, msgId }: MSG_BUBBLE) {
  const contactNameProvider = useContactNameProvider();
  const { chatId } = useParams<{ chatId: string }>();

  return (
    <div className="flex message-bubble rounded-md" data-message-id={msgId}>
      <div className="flex flex-col gap-1">
        <div className="pestry1 pe-1">
          <div>
            <IconUser
              size={18}
              color="white"
              className="absolute top-1/2 left-1/2 -translate-1/2"
            />
          </div>
        </div>
        <div className="pestry2 message-bubble-pestry"></div>
      </div>
      <div className="pestry3 message-bubble-pestry p-6 py-2 relative">
        {chatId?.includes("group") && (
          <Text size="xs" mb={2} className="text-gray-300">
            {contactNameProvider(createdBy)}
          </Text>
        )}
        {children}
      </div>
    </div>
  );
}

export default MessageBubble;
