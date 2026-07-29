import ChatInput from "./ChatInput";
import Chatting from "./Chatting";
import Navbar from "./Navbar";

function Conversation() {
  return (
    <div className="p-2 h-full">
      <div className="h-full rounded p-1">
        <div className="flex justify-center h-full">
          <div className="w-8/12">
            <div className="flex flex-col h-full">
              <Navbar />
              <div className="grow min-h-0">
                <Chatting />
              </div>
              <div>
                <ChatInput />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conversation;
