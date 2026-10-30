import { Flex, Loader, Text } from "@mantine/core";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
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
  const appendChats = useChatStore((state) => state.appendChats);
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const viewport = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({
    scrollHeight: 0,
    scrollTop: 0,
  });

  const { trigger, resetTrigger, triggerPayload, setTrigger } = useTriggerStore(
    (state) => state,
  );
  const navigate = useNavigate();
  const { targetUserDetails, target_user, userDetails } = useAuthStore(
    (state) => state,
  );
  const { current_chat } = useChatStore((state) => state);
  const user_id = target_user ? target_user : userDetails?.username;

  const [fetchLoader, FetchFn] = useTransition();
  const [paginationLoader, PaginationFn] = useTransition();

  const mediaDecryptor = useMediaDecryptor();
  const { translation } = useTranslation();

  const [allowNewFetch, setAllowNewFetch] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [fetchWithPagination, setFetchWithPagination] =
    useState<boolean>(false);
  const [chatPassword, setChatPassword] = useState({});

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

      let params = {
        other_user: nextPerson(chatId),
        target_user: target_user ? target_user : undefined,
        limit: 10,
        page: currentPage,
      };

      if (trigger === TRIGGERS.refreshChat) {
        params.page = 1;
        resetTrigger();
      }

      if (trigger === TRIGGERS.chatPasswordPayload) {
        params = {
          ...params,
          ...triggerPayload,
        };
        setChatPassword({ ...triggerPayload });
      }

      if (Object.keys(chatPassword).length > 0) {
        params = {
          ...params,
          ...chatPassword,
        };
      }

      const response = await api.get(ENDPOINTS.CHAT.GET, {
        params,
      });

      if (!response.data?.success) {
        Notification.error(
          translation(
            "chat_history.noti-chat-121-fail",
            "Failed to fetch chats",
          ),
        );
        return;
      }

      if (allowNewFetch && params.page > 1) {
        appendChats({
          messages: response.data?.data?.messages,
          direction: "up",
        });
      } else {
        addChats(response.data?.data?.messages);
        if (fetchWithPagination) {
          setFetchWithPagination(false);
        }
      }

      setAllowNewFetch(response?.data?.data?.has_next);

      if (response?.data?.data?.has_next) {
        setCurrentPage(currentPage + 1);
      } else {
        setCurrentPage(1);
      }

      if (currentPage > 1) {
        setFetchWithPagination(true);
      } else {
        setFetchWithPagination(false);
      }
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
      navigate("/chats");
    }
  };

  const fetchGroupsChats = async () => {
    try {
      if (!chatId) return;

      let params = {
        group_id: encodeURIComponent(chatId),
        target_user: target_user ? target_user : undefined,
        page: currentPage,
        limit: 10,
      };

      if (trigger === TRIGGERS.chatPasswordPayload) {
        params = {
          ...params,
          ...triggerPayload,
        };
        setChatPassword({ ...triggerPayload });
      }

      if (Object.keys(chatPassword).length > 0) {
        params = {
          ...params,
          ...chatPassword,
        };
      }

      const response = await api.get(ENDPOINTS.GROUP_CHAT.GET, {
        params,
      });

      if (!response.data?.success) {
        Notification.error(
          translation(
            "chat_history.noti-chat-group-fail",
            "Failed to fetch chats",
          ),
        );
        return;
      }

      if (allowNewFetch) {
        appendChats({
          messages: response.data?.data?.messages,
          direction: "up",
        });
      } else {
        addChats(response.data?.data?.messages);
      }

      setAllowNewFetch(response?.data?.data?.has_next);

      if (response?.data?.data?.has_next) {
        setCurrentPage(currentPage + 1);
      } else {
        setCurrentPage(1);
      }

      if (currentPage > 1) {
        setFetchWithPagination(true);
      } else {
        setFetchWithPagination(false);
      }
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

  const initialApiCalls = () => {
    if (!user_id) return;

    if (current_chat?.is_locked && current_chat.is_locked[user_id]) {
      setTrigger({
        toTrigger: TRIGGERS.chatPasswordModal,
      });
      return;
    }
    fetchChats();
  };

  const triggerHandler = () => {
    switch (trigger) {
      case TRIGGERS.refreshChat:
        initialApiCalls();
        break;
      case TRIGGERS.searchByTag:
        FetchFn(fetchByTags);
        break;
      case TRIGGERS.chatPasswordPayload:
        fetchChats();
        resetTrigger();
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

  const handlePagination = () => {
    if (messages.length === 0) return;
    if (paginationLoader) return;
    const element = viewport.current;

    if (!element || !allowNewFetch) return;

    scrollPositionRef.current = {
      scrollHeight: element.scrollHeight,
      scrollTop: element.scrollTop,
    };

    if (element.scrollTop <= 0) {
      if (chatId?.includes("group")) {
        PaginationFn(fetchGroupsChats);
      } else {
        PaginationFn(fetchOneToOneChats);
      }
    }
  };

  // reset states
  useEffect(() => {
    setAllowNewFetch(false);
    setCurrentPage(1);
    setFetchWithPagination(false);
    setChatPassword({});

    scrollPositionRef.current = {
      scrollHeight: 0,
      scrollTop: 0,
    };

    addChats([]);
  }, [current_chat]);

  useEffect(() => {
    initialApiCalls();
  }, [chatId]);

  useEffect(() => {
    if (fetchWithPagination) return;
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

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const { scrollHeight, scrollTop } = scrollPositionRef.current;

    if (scrollHeight > 0 && element.scrollHeight > scrollHeight) {
      element.scrollTop = scrollTop + (element.scrollHeight - scrollHeight);

      scrollPositionRef.current = {
        scrollHeight: 0,
        scrollTop: 0,
      };
    }
  }, [messages]);

  if (fetchLoader) return <ConversationShimmer />;

  return (
    <div
      className="overflow-auto h-full"
      onScroll={handlePagination}
      ref={viewport}
    >
      <div className="flex flex-col gap-2 my-2">
        {paginationLoader && (
          <div className="text-center">
            <Loader size={"sm"} />
          </div>
        )}
        {messages.map((msg, msgIndex) => {
          const newMsgDate = formatMessageDate(msg.created_on ?? "");
          const oldMsgDate = formatMessageDate(
            messages[msgIndex - 1]?.created_on ?? "",
          );
          return (
            <div key={msg._id}>
              {newMsgDate !== oldMsgDate ? (
                <Flex justify={"center"} className="sticky top-0 mb-2 z-10">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
