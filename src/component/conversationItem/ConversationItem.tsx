import { Avatar, Badge, Group, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { getAvatarColor } from "../../utils/constant";

export interface Conversation {
  _id: string;
  display_name: string;
  unread_count: number;
  last_message_timestamp: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  onClick?: () => void;
}

export default function ConversationItem({
  conversation,
  onClick,
}: ConversationItemProps) {
  return (
    <Group
      justify="space-between"
      align="flex-start"
      wrap="nowrap"
      p="xs"
      style={{
        borderRadius: 12,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar radius="xl" size={45} color={getAvatarColor(conversation.display_name)}>
          {conversation.display_name.charAt(0).toUpperCase()}
        </Avatar>

        <Stack gap={2}>
          <Text fw={600} size="sm">
            {conversation.display_name}
          </Text>

          {/* <Text
            size="xs"
            c="dimmed"
          >
            Tap to start chatting
          </Text> */}
        </Stack>
      </Group>

      <Stack gap={6} align="flex-end">
        <Text size="xs" c="dimmed">
          {dayjs(conversation.last_message_timestamp).format("hh:mm A")}
        </Text>

        {conversation.unread_count > 0 && (
          <Badge color="green" radius="lg" variant="filled" size="xs">
            {conversation.unread_count}
          </Badge>
        )}
      </Stack>
    </Group>
  );
}
