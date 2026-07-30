import Chatcards from "./chatbar/Chatcards";
import ChatTabs from "./chatbar/ChatTabs";
import Search from "./chatbar/Search";

function Sidebar() {
  return (
    <div className="h-full bg-white shadow">
      <div className="flex flex-col gap-1 p-1 h-full">
        <div className="shrink-0">
          <Search />
        </div>
        <div className="shrink-0">
          <ChatTabs />
        </div>
        <div className="grow min-h-0">
          <Chatcards />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
