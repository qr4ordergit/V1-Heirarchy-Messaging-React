import { ActionIcon, Avatar, Menu } from "@mantine/core";
import {
  IconDotsVertical,
  IconTrash,
  IconUserCircle,
} from "@tabler/icons-react";
import { useDMListStore } from "../../../store/dm/dm.list.store";
import { useParams } from "react-router";

function Navbar() {
  const dms = useDMListStore((state) => state.dms ?? []);

  const { chatId } = useParams<{ chatId: string }>();

  const displayName =
    dms.find((userDoc) => userDoc._id === decodeURIComponent(chatId ?? ""))
      ?.display_name ?? "";

  return (
    <div className="bg-white rounded-full p-2 shadow">
      <div className="flex gap-3 items-center">
        <Avatar color="cyan" radius="xl">
          {displayName[0]?.toUpperCase()}
        </Avatar>
        <div className="font-medium">{displayName}</div>
        <div className="ms-auto">
          <Menu width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="light"
                radius="xl"
                size={36}
                aria-label="Attach file"
              >
                <IconDotsVertical />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconUserCircle size={14} />}>
                Profile
              </Menu.Item>
              <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
                Delete chat
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
