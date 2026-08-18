import { ActionIcon, Avatar, Menu, ScrollArea } from "@mantine/core";
import {
  IconDotsVertical,
  IconRefresh,
  IconSearch,
  IconStar,
  IconTextRecognition,
  IconTrash,
} from "@tabler/icons-react";
import { useDMListStore } from "../../../store/dm/dm.list.store";
import { useParams } from "react-router";
import { useGroupListStore } from "../../../store/groups/group.list.store";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";
import { useTagStore } from "../../../store/tags/tags.store";

function Navbar() {
  const { dms } = useDMListStore((state) => state);
  const { groups } = useGroupListStore((state) => state);
  const { setTrigger } = useTriggerStore((state) => state);
  const { tags } = useTagStore((state) => state);

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

  const onSearchByText = () => {
    setTrigger({
      toTrigger: TRIGGERS.searchByText,
    });
  };

  const onSearchByTag = (tag = "") => {
    setTrigger({
      toTrigger: TRIGGERS.searchByTag,
      payload: {
        tag: tag,
      },
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
              <Menu.Sub openDelay={120} closeDelay={150}>
                <Menu.Sub.Target>
                  <Menu.Sub.Item leftSection={<IconSearch size={14} />}>
                    Search
                  </Menu.Sub.Item>
                </Menu.Sub.Target>

                <Menu.Sub.Dropdown>
                  <Menu.Item
                    onClick={onSearchByText}
                    leftSection={<IconTextRecognition size={14} />}
                  >
                    By text
                  </Menu.Item>

                  <Menu.Sub
                    openDelay={120}
                    closeDelay={150}
                    disabled={tags.length === 0}
                  >
                    <Menu.Sub.Target>
                      <Menu.Sub.Item
                        disabled={tags.length === 0}
                        leftSection={<IconStar size={14} />}
                      >
                        By tags
                      </Menu.Sub.Item>
                    </Menu.Sub.Target>

                    <Menu.Sub.Dropdown miw={150}>
                      <Menu.Label>Select tag</Menu.Label>
                      <ScrollArea
                        h={Math.min(tags.length * 36, 250)}
                        scrollbarSize={6}
                      >
                        {tags.map((tag, i) => (
                          <Menu.Item onClick={() => onSearchByTag(tag)} key={i}>
                            {tag}
                          </Menu.Item>
                        ))}
                      </ScrollArea>
                    </Menu.Sub.Dropdown>
                  </Menu.Sub>
                </Menu.Sub.Dropdown>
              </Menu.Sub>

              <Menu.Divider />

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
