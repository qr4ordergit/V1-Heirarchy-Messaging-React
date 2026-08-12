import { useNavigate, useParams } from "react-router";
import type { Groups } from "../../store/groups/group.list.store";
import { Avatar, Badge, Flex, Group, Stack, Text } from "@mantine/core";
import { formatConversationTime, getAvatarColor } from "../../utils/constant";

interface GroupItemProps {
  groups: Groups;
}

const GroupsItem = ({ groups }: GroupItemProps) => {
  const { chatId } = useParams();
  const navigate = useNavigate();

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
          {
            groups.only_admins_can_message &&
          <Text c={"dimmed"} size="xs">
            Channel
          </Text>
          }
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
          </Flex>
        </Stack>
      </Group>
    </Group>
  );
};
export default GroupsItem;
