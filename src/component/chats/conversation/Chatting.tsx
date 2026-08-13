import { ScrollArea, Stack } from "@mantine/core";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { useEffect, useRef, useTransition } from "react";
import { ConversationShimmer } from "../../loaders/shimmers/ConversationShimmer";
import { Notification } from "../../../utils/notification";
import { useChatStore } from "../../../store/chats/chats.store";
import { useNavigate, useParams } from "react-router";
import { useNextPerson } from "../../../hooks/useNextPerson";
import { MessageChat } from "./MessageChat";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";

export default function Chatting() {
  const messages = useChatStore((state) => state.chats);
  const addChats = useChatStore((state) => state.addChats);
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const viewport = useRef<HTMLDivElement>(null);
  const { trigger, resetTrigger } = useTriggerStore((state) => state);
  const navigate = useNavigate();

  const [fetchLoader, FetchFn] = useTransition();

  const fetchOneToOneChats = async () => {
    try {
      if (!chatId) return;

      const response = await api.get(
        `${ENDPOINTS.CHAT.GET}${nextPerson(chatId)}`,
      );

      if (!response.data?.success) {
        Notification.error("Something went wrong");
        return;
      }

      addChats(response.data?.data?.messages ?? []);
    } catch (error) {
      Notification.error("something went wrong");
      navigate("/chats");
    }
  };

  const fetchGroupsChats = async () => {
    try {
      if (!chatId) return;

      const response = await api.get(
        `${ENDPOINTS.GROUP_CHAT.GET}${encodeURIComponent(chatId)}`,
      );

      if (!response.data?.success) {
        Notification.error("Something went wrong");
        return;
      }

      addChats(response.data?.data?.messages ?? []);
    } catch (error) {
      Notification.error("something went wrong");
      navigate("/chats");
    }
  };

  const fetchChats = () => {
    if (chatId?.includes("group")) {
      FetchFn(fetchGroupsChats);
    } else {
      FetchFn(fetchOneToOneChats);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const element = viewport.current?.querySelector(
      `[data-message-id="${messageId}"]`,
    );

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.classList.add("bg-gray-200");

    setTimeout(() => {
      element.classList.remove("bg-gray-200");
    }, 1500);
  };

  const triggerHandler = () => {
    switch (trigger) {
      case TRIGGERS.refreshChat:
        fetchChats();
        resetTrigger();
        break;
    }
  };

  useEffect(() => {
    fetchChats();
  }, [chatId]);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, fetchLoader]);

  useEffect(() => {
    triggerHandler();
  }, [trigger]);

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
          return (
            <MessageChat
              key={msg._id}
              msg={msg}
              onReplyClick={scrollToMessage}
            />
          );
        })}
      </Stack>
    </ScrollArea>
  );
}
