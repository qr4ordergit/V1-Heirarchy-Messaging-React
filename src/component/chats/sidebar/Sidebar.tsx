import Chatbar from "./chatbar/Chatbar";
import { Center, SegmentedControl } from "@mantine/core";
import {
  IconAddressBook,
  IconBrandLine,
  IconSettings,
} from "@tabler/icons-react";
import { useState } from "react";
import Settings from "./settings/Settings";
import Contacts from "./contacts/Contacts";

const data = [
  {
    value: "Chats",
    label: (
      <Center style={{ gap: 10 }}>
        <IconBrandLine size={16} />
        <span>Chats</span>
      </Center>
    ),
  },
  {
    value: "Contacts",
    label: (
      <Center style={{ gap: 10 }}>
        <IconAddressBook size={16} />
        <span>Contacts</span>
      </Center>
    ),
  },
  {
    value: "Setting",
    label: (
      <Center style={{ gap: 10 }}>
        <IconSettings size={16} />
        <span>Setting</span>
      </Center>
    ),
  },
];

function Sidebar() {
  const [activeTab, setActiveTab] = useState("Chats");
  return (
    <div className="h-full bg-white shadow">
      <div className="flex flex-col gap-1 p-1 h-full">
        {activeTab === "Chats" && <Chatbar />}
        {activeTab === "Setting" && <Settings />}
        {activeTab === "Contacts" && <Contacts />}
        <div className="mt-auto">
          <SegmentedControl
            fullWidth
            color="gray"
            data={data}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
