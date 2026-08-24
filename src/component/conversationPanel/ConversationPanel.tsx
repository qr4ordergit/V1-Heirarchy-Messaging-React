import {
  Box,
  Button,
  Flex,
  Group,
  Input,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import Heading from "../heading/Heading";
import { IconSearch } from "@tabler/icons-react";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import DmList from "../dmList/DmList";
import GroupList from "../groupList/GroupList";
import { useNavigate } from "react-router";
import { ROUTES } from "../../router/routes";
import { useAuthStore } from "../../store/auth/auth.store";

export default function ConversationPanel() {
  const type = useConversationTypeStore((state) => state.type);
  const setType = useConversationTypeStore((state) => state.setType);
  const search = useConversationTypeStore((state) => state.search);
  const setSearch = useConversationTypeStore((state) => state.setSearch);
  const target_user = useAuthStore((state) => state.target_user);
  const userDetails = useAuthStore((state) => state.userDetails);

  const navigate = useNavigate();

  const activeUsername = target_user || userDetails?.username || "";

  const conversationTypes = [
    { label: "DM", value: "dm" },
    { label: "Groups", value: "groups" },
  ] as const;

  return (
    <Paper
      radius="md"
      bg="white"
      p={10}
      style={{
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Stack
        gap={15}
        style={{
          height: "100%",
          minHeight: 0,
        }}
      >
        <Flex align={"center"} gap={"xs"} justify={"space-between"}>
          <Heading c="var(--mantine-color-blue-4)">Chat Hub</Heading>
          <Group gap={4} wrap="nowrap">
            <Text size="xs" c={"dimmed"}>
              {activeUsername}
            </Text>
          </Group>
        </Flex>
        <Input
          size="xs"
          placeholder="Search"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Group gap="xs">
          {conversationTypes.map(({ label, value }) => (
            <Button
              key={value}
              size="compact-xs"
              radius="xl"
              variant={type === value ? "filled" : "outline"}
              onClick={() => {
                navigate(`/${ROUTES.CHATS}`);
                setType(value);
                setSearch("");
              }}
            >
              {label}
            </Button>
          ))}
        </Group>
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
          }}
        >
          <ScrollArea h="100%" offsetScrollbars scrollbarSize={3}>
            {type === "dm" ? <DmList /> : <GroupList />}
          </ScrollArea>
        </Box>
      </Stack>
    </Paper>
  );
}
