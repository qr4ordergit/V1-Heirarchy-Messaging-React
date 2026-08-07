import { ScrollArea, Stack } from "@mantine/core";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { useEffect, useRef, useTransition } from "react";
import { ConversationShimmer } from "../../loaders/shimmers/ConversationShimmer";
import { Notification } from "../../../utils/notification";
import { useChatStore } from "../../../store/chats/chats.store";
import { useParams } from "react-router";
import { useNextPerson } from "../../../hooks/useNextPerson";
import { MessageChat } from "./MessageChat";

export default function Chatting() {
  const messages = useChatStore((state) => state.chats);
  const addChats = useChatStore((state) => state.addChats);
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const viewport = useRef<HTMLDivElement>(null);

  const [fetchLoader, FetchFn] = useTransition();

  const fetchOneToOneChats = async () => {
    if (!chatId) return;

    const response = await api.get(
      `${ENDPOINTS.CHAT.GET}${nextPerson(chatId)}`,
    );

    if (!response.data?.success) {
      Notification.error("Something went wrong");
      return;
    }

    addChats(response.data?.data?.messages ?? []);
  };

  const fetchChats = () => {
    FetchFn(fetchOneToOneChats);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, fetchLoader]);

  if (fetchLoader) return <ConversationShimmer />;

  return (
    <ScrollArea
      h={"100%"}
      scrollbarSize={8}
      offsetScrollbars
      className="py-2"
      viewportRef={viewport}
    >
      <Stack py="md" gap="sm" className="h-100">
        {messages.map((msg) => {
          return <MessageChat key={msg._id} msg={msg} />;
        })}
      </Stack>
    </ScrollArea>
  );
}
