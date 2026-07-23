import { useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";

function Chat() {
  const [activeTab, setActiveTab] = useState("dm");

  return (
    <div className="d-flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-grow-1 p-4">
        {activeTab === "dm" && <h2>Direct Messages</h2>}
        {activeTab === "contacts" && <h2>Contacts</h2>}
        {activeTab === "profile" && <h2>Profile</h2>}
      </div>
    </div>
  );
}

export default Chat;