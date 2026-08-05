import {
  // ActionIcon,
  Box,
  Button,
  Group,
  Input,
  Paper,
  ScrollArea,
  Stack,
} from "@mantine/core";
import Heading from "../heading/Heading";
import { IconSearch, 
  // IconUsersPlus
 } from "@tabler/icons-react";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import DmList from "../dmList/DmList";

export default function ConversationPanel() {
  const type = useConversationTypeStore((state) => state.type);
  const setType = useConversationTypeStore((state) => state.setType);

  const conversationTypes = [
    { label: "DM", value: "dm" },
    { label: "Groups", value: "groups" },
  ] as const;

  return (
    <Paper radius="md" className="h-full overflow-hidden" bg="white" p={10}>
      <Stack gap={15} h={"100%"}>
        <Heading c="var(--mantine-color-blue-4">Chat Hub</Heading>
        <Input
          size="xs"
          placeholder="Search"
          leftSection={<IconSearch size={14} />}
        />
        <Group gap="xs">
          {conversationTypes.map(({ label, value }) => (
            <Button
              key={value}
              size="compact-xs"
              radius="xl"
              variant={type === value ? "filled" : "outline"}
              onClick={() => {
                setType(value);
              }}
            >
              {label}
            </Button>
          ))}
        </Group>
        <Box style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <ScrollArea style={{ height: "100%" }} offsetScrollbars scrollbarSize={3}>
            {type === "dm" && <DmList />}
          </ScrollArea> 

          {/* {type === "groups" && (
            <ActionIcon pos="absolute" bottom={10} right={10} size={30}>
              <IconUsersPlus size={15} />
            </ActionIcon>
          )} */}
        </Box>
      </Stack>
    </Paper>
  );
}
