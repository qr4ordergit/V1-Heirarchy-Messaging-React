import { SegmentedControl } from "@mantine/core";

function ChatTabs() {
  return (
    <SegmentedControl
      fullWidth
      color="blue"
      size="md"
      defaultValue="Direct messages"
      data={["Direct messages", "Groups"]}
    />
  );
}

export default ChatTabs;
