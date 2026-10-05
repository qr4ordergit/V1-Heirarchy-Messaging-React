import { Flex, ScrollArea, Stack, Text } from "@mantine/core";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { Fragment, useEffect, useRef, useTransition } from "react";
import { ConversationShimmer } from "../../loaders/shimmers/ConversationShimmer";
import { Notification } from "../../../utils/notification";
import { useChatStore, type MESSAGE } from "../../../store/chats/chats.store";
import { useNavigate, useParams } from "react-router";
import { useNextPerson } from "../../../hooks/useNextPerson";
import { MessageChat } from "./MessageChat";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";
import { useAuthStore } from "../../../store/auth/auth.store";
import EncryptedChatCard from "./EncryptedChatCard";
import useMediaDecryptor from "../../../hooks/useMediaDecryptor";
import { useTranslation } from "../../../store/language/language.store";
import { getApiErrorMessage } from "../../../api/getApiErrorMessage";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export default function Chatting() {
  const messages = useChatStore((state) => state.chats);
  const addChats = useChatStore((state) => state.addChats);
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const viewport = useRef<HTMLDivElement>(null);
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const navigate = useNavigate();
  const { targetUserDetails } = useAuthStore((state) => state);

  const [fetchLoader, FetchFn] = useTransition();

  const mediaDecryptor = useMediaDecryptor();
  const { translation } = useTranslation();

  const formatMessageDate = (date: string) => {
    const messageDate = dayjs.utc(date).local();
    const today = dayjs();
    const yesterday = dayjs().subtract(1, "day");

    if (messageDate.isSame(today, "day")) {
      return "Today";
    }

    if (messageDate.isSame(yesterday, "day")) {
      return "Yesterday";
    }

    return messageDate.format("DD MMMM YYYY");
  };

  const fetchOneToOneChats = async () => {
    try {
      if (!chatId) return;

      const target_user = targetUserDetails?.user_id
        ? `&target_user=${targetUserDetails?.user_id}`
        : "";
      const response = await api.get(
        `${ENDPOINTS.CHAT.GET}${nextPerson(chatId)}${target_user}`,
      );

      if (!response.data?.success) {
        Notification.error(
          translation(
            "chat_history.noti-chat-121-fail",
            "Failed to fetch chats",
          ),
        );
        return;
      }

      addChats(response.data?.data?.messages);
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
      navigate("/chats");
    }
  };

  const fetchGroupsChats = async () => {
    try {
      if (!chatId) return;

      const target_user = targetUserDetails?.user_id
        ? `&target_user=${targetUserDetails?.user_id}`
        : "";

      const response = await api.get(
        `${ENDPOINTS.GROUP_CHAT.GET}${encodeURIComponent(chatId)}${target_user}`,
      );

      if (!response.data?.success) {
        Notification.error(
          translation(
            "chat_history.noti-chat-group-fail",
            "Failed to fetch chats",
          ),
        );
        return;
      }

      addChats(response.data?.data?.messages);
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
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

  const fetchByTags = async () => {
    try {
      if (!chatId) return;

      const target_user = targetUserDetails?.user_id
        ? `&target_user=${targetUserDetails?.user_id}`
        : "";

      const response = await api.get(
        `${ENDPOINTS.TAGS_FILTER.GET}?for=${chatId.includes("group") ? "GROUP" : "DM"}&tag_id=${triggerPayload?.tag}&scope_id=${encodeURIComponent(chatId)}${target_user}`,
      );

      if (!response.data?.success) {
        Notification.error(
          translation(
            "chat_history.noti-chat-tags-fail",
            "Failed to fetch tags",
          ),
        );
        return;
      }

      const updatedMsgs = await mediaDecryptor(response.data?.data?.messages);

      addChats(updatedMsgs);
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
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
      case TRIGGERS.searchByTag:
        FetchFn(fetchByTags);
        break;
    }
  };

  const conditionalRenderer = {
    msgCardProvider: (msg: MESSAGE) => {
      if (msg?.double_encryption) {
        return <EncryptedChatCard msg={msg} />;
      } else {
        return <MessageChat msg={msg} onReplyClick={scrollToMessage} />;
      }
    },
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
  }, [messages.length, fetchLoader]);

  useEffect(() => {
    triggerHandler();
  }, [trigger]);

  if (fetchLoader) return <ConversationShimmer />;

  return (
    <ScrollArea
      h={"100%"}
      scrollbarSize={8}
      offsetScrollbars
      className="pb-2"
      viewportRef={viewport}
    >
      <Stack py="md" gap="sm" className="h-100">
        {messages.map((msg, msgIndex) => {
          const newMsgDate = formatMessageDate(msg.created_on ?? "");
          const oldMsgDate = formatMessageDate(
            messages[msgIndex - 1]?.created_on ?? "",
          );
          return (
            <Fragment key={msg._id}>
              {newMsgDate !== oldMsgDate ? (
                <Flex justify={"center"} className="sticky top-0">
                  <Text
                    className="bg-gray-400 rounded-full text-white opacity-80"
                    size="xs"
                    px={10}
                    py={2}
                  >
                    {newMsgDate}
                  </Text>
                </Flex>
              ) : null}
              {conditionalRenderer.msgCardProvider(msg)}
            </Fragment>
          );
        })}
      </Stack>
    </ScrollArea>
  );
}
