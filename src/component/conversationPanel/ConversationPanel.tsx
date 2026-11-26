import {
  Box,
  Button,
  Group,
  Input,
  Paper,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import DmList from "../dmList/DmList";
import GroupList from "../groupList/GroupList";
import { useNavigate } from "react-router";
import { ROUTES } from "../../router/routes";
import { useTranslation } from "../../store/language/language.store";
import { useRef } from "react";

export default function ConversationPanel() {
  const type = useConversationTypeStore((state) => state.type);
  const setType = useConversationTypeStore((state) => state.setType);
  const search = useConversationTypeStore((state) => state.search);
  const setSearch = useConversationTypeStore((state) => state.setSearch);

  const navigate = useNavigate();
  const { translation } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);

  const conversationTypes = [
    { label: translation("chat_page.tab_dm", "DM"), value: "dm" },
    { label: translation("chat_page.tab_groups", "Groups"), value: "groups" },
  ] as const;

  return (
    <Paper
      radius="md"
      bg="var(--app-surface-glass"
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
        <Input
        className="custom-dm-grp-search-input"
          size="xs"
          placeholder={translation("chat_page.search_dm_groups", "Search")}
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
              color={"var(--app-surface-dark)"}
              c={"white"}
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
          <ScrollArea h="100%" offsetScrollbars scrollbarSize={3} viewportRef={viewportRef}>
            {type === "dm" ? <DmList viewportRef={viewportRef}/> : <GroupList />}
          </ScrollArea>
        </Box>
      </Stack>
    </Paper>
  );
}
