import { Button, Group, Input, Paper, Stack } from "@mantine/core";
import Heading from "../heading/Heading";
import { IconSearch } from "@tabler/icons-react";

export default function ConversationPanel() {
  return (
    <Paper radius="md" className="h-full" bg="white" p={10}>
      <Stack gap={15}>
        <Heading c="var(--mantine-color-blue-4">Chat Hub</Heading>
        <Input
          size="xs"
          placeholder="Search"
          leftSection={<IconSearch size={14} />}
        />
        <Group>
          <Button size="compact-xs">DM</Button>
          <Button variant="outline" size="compact-xs">
            Groups
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
