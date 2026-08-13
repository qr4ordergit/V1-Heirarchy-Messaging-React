import { Outlet, useParams } from "react-router";
import { useMediaQuery } from "@mantine/hooks";

import ConversationPanel from "../../component/conversationPanel/ConversationPanel";
import { Box } from "@mantine/core";

export default function ChatsLayout() {
  const mobile = useMediaQuery("(max-width: 1200px)");
  const { chatId } = useParams();

  if (mobile) {
    return chatId ? <Outlet /> : <ConversationPanel />;
  }

  return (
    <Box
  style={{
    height: "100%",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: 12,
    overflow: "hidden",
  }}
>
  <ConversationPanel />
  <Box style={{ minHeight: 0, minWidth: 0 }}>
    <Outlet />
  </Box>
</Box>
  );
}
