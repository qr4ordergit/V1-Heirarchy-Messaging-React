import { ActionIcon, Avatar, Menu } from "@mantine/core";
import {
  IconDotsVertical,
  IconRefresh,
  IconTrash,
  IconUserCircle,
} from "@tabler/icons-react";
import { useDMListStore } from "../../../store/dm/dm.list.store";
import { useParams } from "react-router";
import { useGroupListStore } from "../../../store/groups/group.list.store";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";

function Navbar() {
  const { dms } = useDMListStore((state) => state);
  const { groups } = useGroupListStore((state) => state);
  const { setTrigger } = useTriggerStore((state) => state);

  const { chatId } = useParams<{ chatId: string }>();

  const displayName = () => {
    if (decodeURIComponent(chatId ?? "").includes("group")) {
      return (
        groups.find(
          (userDoc) => userDoc._id === decodeURIComponent(chatId ?? ""),
        )?.group_name ?? ""
      );
    }

    return (
      dms.find((userDoc) => userDoc._id === decodeURIComponent(chatId ?? ""))
        ?.display_name ?? ""
    );
  };

  const onRefresh = () => {
    setTrigger({
      toTrigger: TRIGGERS.refreshChat,
    });
  };

  return (
    <div className="bg-white rounded-full p-2 shadow">
      <div className="flex gap-3 items-center">
        <Avatar color="cyan" radius="xl">
          {displayName()[0]?.toUpperCase()}
        </Avatar>
        <div className="font-medium">{displayName()}</div>
        <div className="ms-auto">
          <ActionIcon variant="light" radius="xl" size={36} onClick={onRefresh}>
            <IconRefresh />
          </ActionIcon>
        </div>
        <div>
          <Menu width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="light" radius="xl" size={36}>
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
