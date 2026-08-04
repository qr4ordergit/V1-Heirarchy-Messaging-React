import { Outlet, useParams } from "react-router";
import { useMediaQuery } from "@mantine/hooks";

import ConversationPanel from "../../component/conversationPanel/ConversationPanel";

export default function ChatsLayout() {
  const mobile = useMediaQuery("(max-width: 1200px)");
  const { chatId } = useParams();

  if (mobile) {
    return chatId ? <Outlet /> : <ConversationPanel />;
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[320px_1fr]">
      <ConversationPanel />

      <Outlet />
    </div>
  );
}
