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

import { IconDotsVertical, IconLock, IconTrash } from "@tabler/icons-react";

import { formatConversationTime, getAvatarColor } from "../../utils/constant";
import { useNavigate, useParams } from "react-router";
import { ROUTES } from "../../router/routes";
import type { DM } from "../../store/dm/dm.list.store";
import { useTranslation } from "../../store/language/language.store";
interface ConversationItemProps {
  conversation: DM;
  onDelete: () => void;
  onSetLockDmAndGroupModalData: () => void;
  unLock:() => void;
}

export default function ConversationItem({
  conversation,
  onDelete,
  onSetLockDmAndGroupModalData,
  unLock
}: ConversationItemProps) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { translation } = useTranslation();
  const isLocked =  Object.keys(conversation.is_locked ?? {}).length > 0
  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      p={"xs"}
      bg={chatId === conversation._id ? "#edf2ff" : "white"}
      style={{
        borderRadius: 12,
        cursor: "pointer",
      }}
      onClick={() => {
        navigate(`/chats/${encodeURIComponent(conversation._id)}`);
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar
          radius="xl"
          size={45}
          color={getAvatarColor(conversation.display_name)}
          src={conversation.profile_url}
        >
          {conversation.display_name.charAt(0).toUpperCase()}
        </Avatar>

        <Stack gap={2}>
          <Text fw={600} size="sm">
            {conversation.display_name}
          </Text>
        </Stack>
      </Group>

      <Group gap={6} wrap="nowrap">
        <Stack gap={6} align="flex-end">
          <Text size="xs" c="dimmed">
            {formatConversationTime(conversation.last_message_timestamp)}
          </Text>
          <Flex gap={1} align={"center"}>
            {conversation.unread_count > 0 && (
              <Badge
                color="green"
                radius="xl"
                variant="filled"
                size="xs"
                mr={"xs"}
              >
                {conversation.unread_count}
              </Badge>
            )}
            {isLocked && <IconLock size={13} />}
            <Menu position="bottom-start" withArrow>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
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
                      return
                    }
                    unLock()
                  }}
                >
                  <Text size="xs">
                    {
                      !isLocked ?
                    translation(
                      "chat_page.label_lock_conversation",
                      "Lock conversation",
                    ) : 
                    translation(
                      "chat_page.label_unlock_conversation",
                      "Unlock conversation",
                    )
                    }
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
