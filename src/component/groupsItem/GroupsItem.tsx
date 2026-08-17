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
import { IconDotsVertical, IconLogout2 } from "@tabler/icons-react";
import { useAuthStore } from "../../store/auth/auth.store";

interface GroupItemProps {
  groups: Groups;
  onLeave: () => void;
}

const GroupsItem = ({ groups, onLeave }: GroupItemProps) => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { target_user, userDetails } = useAuthStore((state) => state);
  const isAdmin =
  target_user === ""
    ? userDetails !== null &&
      groups.admins.includes(userDetails.username)
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
              Channel
            </Text>
          )}
        </Stack>
      </Group>

      <Group gap={6} wrap="nowrap">
        <Stack gap={6} align="flex-end">
          <Text size="xs" c="dimmed">
            {formatConversationTime(groups.last_message)}
          </Text>
          <Flex gap={6} align={"center"}>
            {groups.unread_count > 0 && (
              <Badge color="green" radius="lg" variant="filled" size="xs">
                {groups.unread_count}
              </Badge>
            )}
            {!isAdmin && (
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
                        color="red"
                        leftSection={<IconLogout2 size={13} />}
                        onClick={(event) => {
                          event.stopPropagation();
                          onLeave();
                        }}
                      >
                        <Text size="xs">Leave Group</Text>
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
          </Flex>
        </Stack>
      </Group>
    </Group>
  );
};
export default GroupsItem;
