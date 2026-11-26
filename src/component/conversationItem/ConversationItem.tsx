import {
  ActionIcon,
  Avatar,
  Badge,
  Flex,
  Group,
  Menu,
  Stack,
  Text,
} from "@mantine/core";

import { IconDotsVertical, IconLock, IconTrash, IconUser } from "@tabler/icons-react";

import { formatConversationTime } from "../../utils/constant";
import { useNavigate, useParams } from "react-router";
import { ROUTES } from "../../router/routes";
import type { DM } from "../../store/dm/dm.list.store";
import { useTranslation } from "../../store/language/language.store";
import { useChatStore } from "../../store/chats/chats.store";
interface ConversationItemProps {
  conversation: DM;
  onDelete: () => void;
  onSetLockDmAndGroupModalData: () => void;
  unLock: () => void;
}

export default function ConversationItem({
  conversation,
  onDelete,
  onSetLockDmAndGroupModalData,
  unLock,
}: ConversationItemProps) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { translation } = useTranslation();
  const isLocked = Object.keys(conversation.is_locked ?? {}).length > 0;
  const { insertCurrentChat, emptyChatList } = useChatStore((state) => state);

  const handleClick = () => {
    if (chatId === conversation._id) return;
    emptyChatList();
    insertCurrentChat({
      ...conversation,
    });
    navigate(`/chats/${encodeURIComponent(conversation._id)}`);
  };
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="nowrap"
      p={"xs"}
      bg={chatId === conversation._id ? "var(--app-surface-dark)" : "var(--app-surface-light)"}
      style={{
        borderRadius: 12,
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar
          radius="md"
          size={45}
          color={"white"}
          bg={"var(--app-surface-dark)"}
          src={conversation.profile_url}
        >
          <IconUser/>
        </Avatar>

          <Text fw={600} c={"white"} size="sm" style={{ flex: 1, minWidth: 0 }}>
            {conversation.display_name}
          </Text>
      </Group>

      <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
        <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
          <Text size="xs" c="white">
            {formatConversationTime(conversation.last_message_timestamp)}
          </Text>
          <Flex align={"center"} gap={6}>
            {conversation.unread_count > 0 && (
              <Badge
                color="var(--app-surface-dark)"
                radius="xl"
                variant="filled"
                size="xs"
              >
                {conversation.unread_count}
              </Badge>
            )}
            <Menu position="bottom-start" withArrow>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="white"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/${ROUTES.CHATS}`);
                  }}
                >
                  <IconDotsVertical size={13} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconLock size={13} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isLocked) {
                      onSetLockDmAndGroupModalData();
                      return;
                    }
                    unLock();
                  }}
                >
                  <Text size="xs">
                    {!isLocked
                      ? translation(
                          "chat_page.label_lock_conversation",
                          "Lock conversation",
                        )
                      : translation(
                          "chat_page.label_unlock_conversation",
                          "Unlock conversation",
                        )}
                  </Text>
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={13} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                >
                  <Text size="xs">
                    {translation(
                      "chat_page.label_delete_con",
                      "Delete conversation",
                    )}
                  </Text>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Flex>
        </Stack>
      </Group>
    </Group>
  );
}
