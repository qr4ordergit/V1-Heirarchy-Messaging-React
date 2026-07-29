import Chatcards from "./Chatcards";
import ChatTabs from "./ChatTabs";
import Search from "./Search";

function Chatbar() {
  return (
    <>
      <div className="shrink-0">
        <Search />
      </div>
      <div className="shrink-0">
        <ChatTabs />
      </div>
      <div className="grow min-h-0">
        <Chatcards />
      </div>
    </>
  );
}

export default Chatbar;
