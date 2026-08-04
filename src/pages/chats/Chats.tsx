import ChatPanel from "../../component/chatPanel/ChatPanel";
import ConversationPanel from "../../component/conversationPanel/ConversationPanel";

export default function Chats() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <ConversationPanel />

      <ChatPanel />
    </div>
  );
}