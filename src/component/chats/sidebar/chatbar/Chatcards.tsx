import { ScrollArea, Stack } from "@mantine/core";
import Chatcard from "./Chatcard";
import { useNavigate } from "react-router";

function Chatcards() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("1");
  };
  return (
    <ScrollArea h="100%">
      <Stack gap={3}>
        <Chatcard
          active
          name="John Doe"
          avatar="https://i.pravatar.cc/150?img=1"
          message="Hey! Are we still meeting tomorrow evening? Let me know."
          unreadCount={3}
          onClick={handleClick}
        />
        <Chatcard
          name="Emma Watson"
          avatar="https://i.pravatar.cc/150?img=5"
          message="Thanks! I'll send the documents shortly."
          onClick={handleClick}
        />
        <Chatcard
          name="Design Team"
          avatar="https://i.pravatar.cc/150?img=12"
          message="The latest Figma prototype has been shared with everyone."
          unreadCount={12}
          onClick={handleClick}
        />
      </Stack>
    </ScrollArea>
  );
}

export default Chatcards;
