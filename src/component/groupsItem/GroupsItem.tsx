import { useNavigate, useParams } from "react-router";
import type { Groups } from "../../store/groups/group.list.store";
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
import { formatConversationTime, getAvatarColor } from "../../utils/constant";
import { ROUTES } from "../../router/routes";
import { IconDotsVertical, IconLock, IconLogout2 } from "@tabler/icons-react";
import { useAuthStore } from "../../store/auth/auth.store";
import { useTranslation } from "../../store/language/language.store";

interface GroupItemProps {
  groups: Groups;
  onLeave: () => void;
  onSetLockDmAndGroupModalData: () => void;
  unLock: () => void;
}

const GroupsItem = ({
  groups,
  onLeave,
  onSetLockDmAndGroupModalData,
  unLock
}: GroupItemProps) => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { translation } = useTranslation();
  const isLocked =  Object.keys(groups.is_locked ?? {}).length > 0

  const { target_user, userDetails } = useAuthStore((state) => state);
  const isAdmin =
    target_user === ""
      ? userDetails !== null && groups.admins.includes(userDetails.username)
      : groups.admins.includes(target_user);

  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      p={"xs"}
      bg={chatId === groups._id ? "#edf2ff" : "white"}
      style={{
        borderRadius: 12,
        cursor: "pointer",
      }}
      onClick={() => {
        navigate(`/chats/${encodeURIComponent(groups._id)}`);
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar
          radius="xl"
          size={45}
          color={getAvatarColor(groups.group_name)}
          src={groups.profile_url}
        >
          {groups.group_name.charAt(0).toUpperCase()}
        </Avatar>

        <Stack gap={2}>
          <Text fw={600} size="sm">
            {groups.group_name}
          </Text>
          {groups.only_admins_can_message && (
            <Text c={"dimmed"} size="xs">
              {translation("chat_page.label_channel", "Channel")}
            </Text>
          )}
        </Stack>
      </Group>

      <Group gap={6} wrap="nowrap">
        <Stack gap={6} align="flex-end">
          <Text size="xs" c="dimmed">
            {formatConversationTime(groups.last_message)}
          </Text>
          <Flex gap={1} align={"center"}>
            {groups.unread_count > 0 && (
              <Badge
                color="green"
                radius="lg"
                variant="filled"
                size="xs"
                mr={"xs"}
              >
                {groups.unread_count}
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
                    {!isLocked
                      ? translation("chat_page.label_lock_group", "Lock group")
                      : translation("chat_page.label_unlock_group", "Unlock group")}
                  </Text>
                </Menu.Item>
                {!isAdmin && (
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout2 size={13} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onLeave();
                    }}
                  >
                    <Text size="xs">
                      {translation(
                        "chat_page.label_leave_group",
                        "Leave Group",
                      )}
                    </Text>
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Flex>
        </Stack>
      </Group>
    </Group>
  );
};
export default GroupsItem;
