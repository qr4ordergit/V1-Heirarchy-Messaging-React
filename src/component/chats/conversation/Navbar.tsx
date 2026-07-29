import { ActionIcon, Avatar, Menu } from "@mantine/core";
import {
  IconDotsVertical,
  IconTrash,
  IconUserCircle,
} from "@tabler/icons-react";

function Navbar() {
  return (
    <div className="bg-white rounded-full p-2 shadow">
      <div className="flex gap-3 items-center">
        <Avatar src="https://i.pravatar.cc/150?img=1" radius="xl" size={32} />
        <div className="font-medium">John Doe</div>
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
