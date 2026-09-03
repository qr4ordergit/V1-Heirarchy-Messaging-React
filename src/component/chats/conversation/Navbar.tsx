import { ActionIcon, Avatar, Menu, ScrollArea } from "@mantine/core";
import {
  IconChevronLeft,
  IconDotsVertical,
  IconRefresh,
  IconSearch,
  IconStar,
  IconTextRecognition,
  IconTrash,
} from "@tabler/icons-react";
import { useDMListStore } from "../../../store/dm/dm.list.store";
import { useNavigate, useParams } from "react-router";
import { useGroupListStore } from "../../../store/groups/group.list.store";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";
import { useTagStore } from "../../../store/tags/tags.store";

interface CURRENT_CHAT {
  display_name?: string;
  profile_url?: string | null;

  [key: string]: unknown;
}

function Navbar() {
  const { dms } = useDMListStore((state) => state);
  const { groups } = useGroupListStore((state) => state);
  const { setTrigger, trigger, resetTrigger } = useTriggerStore(
    (state) => state,
  );
  const { tagsWithCategories } = useTagStore((state) => state);

  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const currentChat = (): CURRENT_CHAT => {
    if (!chatId) return {};

    if (chatId.includes("group")) {
      const chat = groups.find(
        (userDoc) => userDoc._id === decodeURIComponent(chatId),
      );

      return {
        display_name: chat?.group_name,
        profile_url: chat?.profile_url,
      };
    }

    const chat = dms.find(
      (userDoc) => userDoc._id === decodeURIComponent(chatId),
    );
    return {
      display_name: chat?.display_name,
      profile_url: chat?.profile_url,
    };
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
    if (trigger.length > 0) {
      console.log("a");
      resetTrigger();
    }
    setTimeout(() => {
      setTrigger({
        toTrigger: TRIGGERS.searchByTag,
        payload: {
          tag: tag,
        },
      });
    }, 0);
  };

  const onNavigate = () => {
    navigate("/chats");
  };

  return (
    <div className="bg-white rounded-full p-2 shadow">
      <div className="flex gap-3 items-center">
        <div className="lg:hidden block">
          <ActionIcon
            variant="light"
            radius="xl"
            size={36}
            onClick={onNavigate}
          >
            <IconChevronLeft />
          </ActionIcon>
        </div>
        {currentChat().profile_url ? (
          <Avatar src={currentChat().profile_url} />
        ) : (
          <Avatar color="cyan" radius="xl">
            {currentChat().display_name?.[0]?.toUpperCase()}
          </Avatar>
        )}

        <div className="font-medium">{currentChat().display_name}</div>
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

                  <Menu.Sub openDelay={120} closeDelay={150}>
                    <Menu.Sub.Target>
                      <Menu.Sub.Item leftSection={<IconStar size={14} />}>
                        By tags
                      </Menu.Sub.Item>
                    </Menu.Sub.Target>

                    <Menu.Sub.Dropdown miw={150}>
                      {tagsWithCategories.group?.length ? (
                        <>
                          <Menu.Label>Select group tag</Menu.Label>
                          <ScrollArea
                            h={Math.min(
                              tagsWithCategories.group?.length * 36,
                              250,
                            )}
                            scrollbarSize={6}
                          >
                            {tagsWithCategories.group?.map((tag, i) => (
                              <Menu.Item
                                onClick={() => onSearchByTag(tag)}
                                key={i}
                              >
                                {tag}
                              </Menu.Item>
                            ))}
                          </ScrollArea>
                        </>
                      ) : (
                        ""
                      )}
                      {tagsWithCategories.user?.length ? (
                        <>
                          <Menu.Label>Select your tag</Menu.Label>
                          <ScrollArea
                            h={Math.min(
                              tagsWithCategories.user?.length * 36,
                              250,
                            )}
                            scrollbarSize={6}
                          >
                            {tagsWithCategories.user?.map((tag, i) => (
                              <Menu.Item
                                onClick={() => onSearchByTag(tag)}
                                key={i}
                              >
                                {tag}
                              </Menu.Item>
                            ))}
                          </ScrollArea>
                        </>
                      ) : (
                        ""
                      )}
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
