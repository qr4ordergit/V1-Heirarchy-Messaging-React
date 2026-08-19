import { useTriggerStore } from "../../../store/trigger/trigger.store";
import ChatInput from "./ChatInput";
import Chatting from "./Chatting";
import DeleteChatDialog from "./dialouges/DeleteChatDialog";
import EditChatDialog from "./dialouges/EditChatDialog";
import Previewer from "./modals/Previewer";
import TagsModal from "./modals/TagsModal";
import Navbar from "./Navbar";
import TextFilterInputBox from "./TextFilterInputBox";

function Conversation() {
  const { trigger } = useTriggerStore((state) => state);
  return (
    <div className="p-2 h-full">
      <div className="h-full rounded p-1">
        <div className="flex justify-center h-full">
          <div className="w-8/12">
            <div className="flex flex-col h-full">
              <Navbar />
              <div className="flex-1 min-h-0">
                <Chatting />
              </div>
              <div>
                {trigger.includes("search:") ? (
                  <TextFilterInputBox />
                ) : (
                  <ChatInput />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DeleteChatDialog />
      <EditChatDialog />
      <Previewer />
      <TagsModal />
    </div>
  );
}

export default Conversation;
