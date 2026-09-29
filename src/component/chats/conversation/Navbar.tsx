import { ActionIcon, Avatar, Flex, Menu, ScrollArea } from "@mantine/core";
import {
  IconChevronLeft,
  IconClockHour10,
  IconDotsVertical,
  IconMessageDots,
  IconPhotoShield,
  IconProgressDown,
  IconRefresh,
  IconSearch,
  IconStar,
  IconTextRecognition,
  IconX,
} from "@tabler/icons-react";
import { useDMListStore } from "../../../store/dm/dm.list.store";
import { useNavigate, useParams } from "react-router";
import { useGroupListStore } from "../../../store/groups/group.list.store";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { OPENERS, TRIGGERS } from "../../../utils/constant";
import { useTagStore } from "../../../store/tags/tags.store";
import { useTranslation } from "../../../store/language/language.store";
import { useOpenerStore } from "../../../store/openers/opener.store";
import { useEffect, useMemo } from "react";
import { useAuthStore } from "../../../store/auth/auth.store";
import { Notification } from "../../../utils/notification";
import { getApiErrorMessage } from "../../../api/getApiErrorMessage";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { useChatStore } from "../../../store/chats/chats.store";

interface ENCRYPTION_PAYLOAD {
  chat_id: string;
  media_encryption: boolean;
  type?: string;
}

function Navbar() {
  const { dms } = useDMListStore((state) => state);
  const { groups } = useGroupListStore((state) => state);
  const { setTrigger, trigger, resetTrigger } = useTriggerStore(
    (state) => state,
  );
  const { insertOpener } = useOpenerStore((state) => state);
  const { tagsWithCategories } = useTagStore((state) => state);
  const { translation } = useTranslation();
  const { userDetails, target_user } = useAuthStore((state) => state);
  const { modifyCurrentChat, current_chat, insertCurrentChat } = useChatStore(
    (state) => state,
  );

  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const own_user_id = target_user ? target_user : userDetails?.username;
  const isGroup = chatId?.includes("group");

  const isAdmin = useMemo(
    () =>
      own_user_id
        ? groups
            .find((grp) => grp._id === decodeURIComponent(chatId || ""))
            ?.admins.includes(own_user_id)
        : false,
    [chatId, groups],
  );

  const conditionalRenderer = {
    allowDisappear() {
      let allow = true;
      if (isGroup && !isAdmin) {
        allow = false;
      }

      return allow;
    },
    allowMediaEncryption() {
      let allow = true;
      if (isGroup && !isAdmin) {
        allow = false;
      }

      return allow;
    },
  };

  const dataAssigner = () => {
    if (!chatId) return;

    if (chatId.includes("group")) {
      const chat = groups.find(
        (userDoc) => userDoc._id === decodeURIComponent(chatId),
      );

      if (!chat) return;

      insertCurrentChat({
        ...chat,
        display_name: chat?.group_name,
        profile_url: chat?.profile_url,
      });
    } else {
      const chat = dms.find(
        (userDoc) => userDoc._id === decodeURIComponent(chatId),
      );

      insertCurrentChat({
        ...chat,
        display_name: chat?.display_name,
        profile_url: chat?.profile_url,
      });
    }
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

  const onExportChat = () => {
    setTrigger({
      toTrigger: TRIGGERS.exportChatModal,
    });
  };

  const onDisappear = () => {
    setTrigger({
      toTrigger: TRIGGERS.disappearChatModal,
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

  const onSchedule = () => {
    insertOpener({
      opener: OPENERS.schedulerList,
    });
  };

  const handleEncryptionCheck = async (e: boolean) => {
    if (!chatId) return;

    modifyCurrentChat({
      key: "media_encryption",
      value: e,
    });

    const payload: ENCRYPTION_PAYLOAD = {
      chat_id: chatId,
      media_encryption: e,
    };

    if (chatId?.includes("group")) {
      payload["type"] = "GROUP";
    } else {
      payload["type"] = "DM";
    }

    try {
      const params = {
        target_user: target_user ? target_user : undefined,
      };

      await api.put(ENDPOINTS.CHAT_HANDLER.PUT, payload, {
        params,
      });
    } catch (error) {
      modifyCurrentChat({
        key: "media_encryption",
        value: !e,
      });
      Notification.error(getApiErrorMessage(error));
    }
  };

  useEffect(() => {
    dataAssigner();
  }, [chatId, dms, groups]);

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
        {current_chat?.profile_url ? (
          <Avatar src={current_chat?.profile_url} />
        ) : (
          <Avatar color="cyan" radius="xl">
            {current_chat?.display_name?.[0]?.toUpperCase()}
          </Avatar>
        )}

        <div className="font-medium">{current_chat?.display_name}</div>
        <div className="ms-auto">
          <Menu width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="light" radius="xl" size={36}>
                <IconSearch />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                onClick={onSearchByText}
                leftSection={<IconTextRecognition size={14} />}
              >
                {translation("chat_history.NAV-find-byText", "By Text")}
              </Menu.Item>

              <Menu.Sub openDelay={120} closeDelay={150}>
                <Menu.Sub.Target>
                  <Menu.Sub.Item leftSection={<IconStar size={14} />}>
                    {translation("chat_history.NAV-find-byTags", "By Tags")}
                  </Menu.Sub.Item>
                </Menu.Sub.Target>

                <Menu.Sub.Dropdown>
                  {tagsWithCategories.group?.length ? (
                    <>
                      <Menu.Label>
                        {translation(
                          "chat_history.NAV-find-Label1",
                          "Select group tag",
                        )}
                      </Menu.Label>
                      <ScrollArea
                        h={Math.min(tagsWithCategories.group?.length * 36, 250)}
                        scrollbarSize={6}
                      >
                        {tagsWithCategories.group?.map((tag, i) => (
                          <Menu.Item onClick={() => onSearchByTag(tag)} key={i}>
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
                      <Menu.Label>
                        {translation(
                          "chat_history.NAV-find-Label2",
                          "Select your tag",
                        )}
                      </Menu.Label>
                      <ScrollArea
                        h={Math.min(tagsWithCategories.user?.length * 36, 250)}
                        scrollbarSize={6}
                      >
                        {tagsWithCategories.user?.map((tag, i) => (
                          <Menu.Item onClick={() => onSearchByTag(tag)} key={i}>
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
            </Menu.Dropdown>
          </Menu>
        </div>
        <div>
          <ActionIcon variant="light" radius="xl" size={36} onClick={onRefresh}>
            <IconRefresh />
          </ActionIcon>
        </div>
        <div>
          <Menu position="bottom-end" alignItemsLabels="none">
            <Menu.Target>
              <ActionIcon variant="light" radius="xl" size={36}>
                <IconDotsVertical />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {conditionalRenderer.allowMediaEncryption() && (
                <Menu.CheckboxItem
                  checked={current_chat?.media_encryption}
                  onChange={handleEncryptionCheck}
                  color={current_chat?.media_encryption ? "green" : ""}
                  checkIcon={<IconX size={14} />}
                >
                  {current_chat?.media_encryption ? (
                    <div>
                      {translation(
                        "chat_history.NAV-menu-media-encryption-toggle2",
                        "Media encryption active",
                      )}
                    </div>
                  ) : (
                    <Flex align={"center"} gap={10}>
                      <IconPhotoShield size={14} />
                      <div>
                        {translation(
                          "chat_history.NAV-menu-media-encryption-toggle1",
                          "Enable media encryption",
                        )}
                      </div>
                    </Flex>
                  )}
                </Menu.CheckboxItem>
              )}
              {conditionalRenderer.allowDisappear() && (
                <Menu.Item
                  onClick={onDisappear}
                  leftSection={<IconMessageDots size={14} />}
                >
                  {translation(
                    "chat_history.NAV-menu-disappear",
                    "Disappear Messages",
                  )}
                </Menu.Item>
              )}
              <Menu.Item
                onClick={onSchedule}
                leftSection={<IconClockHour10 size={14} />}
              >
                {translation(
                  "chat_history.NAV-menu-scheduled",
                  "Scheduled Messages List",
                )}
              </Menu.Item>
              <Menu.Item
                onClick={onExportChat}
                leftSection={<IconProgressDown size={14} />}
              >
                {translation("chat_history.NAV-export", "Export chat")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
