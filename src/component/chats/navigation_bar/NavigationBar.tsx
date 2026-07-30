import { useState } from "react";
import { Box, NavLink } from "@mantine/core";
import {
  IconAddressBook,
  IconBrandLine,
  IconUserCircle,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
const data = [
  { icon: IconBrandLine, label: "Chats", navigate: "chats" },
  { icon: IconAddressBook, label: "Contacts", navigate: "contacts" },
  { icon: IconUserCircle, label: "Profile", navigate: "profile" },
];

function NavigationBar() {
  const navigate = useNavigate();

  const [active, setActive] = useState("Chats");

  const handleNavigate = (direct: string, label: string) => {
    setActive(label);
    navigate(direct);
  };

  const items = data.map((item) => (
    <NavLink
      key={item.label}
      active={item.label === active}
      label={item.label}
      leftSection={<item.icon size={16} />}
      onClick={() => handleNavigate(item.navigate, item.label)}
    />
  ));

  return <Box w={220}>{items}</Box>;
}

export default NavigationBar;
