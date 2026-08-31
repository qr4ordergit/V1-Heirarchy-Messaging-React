import { ScrollArea, Stack } from "@mantine/core";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { useEffect, useRef, useTransition } from "react";
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
import axios from "axios";
import { E2EHelper } from "../../../utils/e2eHelper";

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
  const { userDetails, target_user } = useAuthStore((state) => state);

  const [fetchLoader, FetchFn] = useTransition();

  const mediaDecryptor = async (msgs: MESSAGE[]): Promise<MESSAGE[]> => {
    if (msgs.length === 0) return [];

    let updatedMessages = [];

    for (let i = 0; i < msgs.length; i++) {
      if (!msgs[i].body?.media_url) {
        updatedMessages.push(msgs[i]);
        continue;
      }

      let medias = msgs[i].body?.media_url;

      if (!medias) continue;

      // -------------get key : START-----------------
      const url =
        "https://u2hjtodeyl.execute-api.ap-south-1.amazonaws.com/dev/api/key-ring";
      const identifier = encodeURIComponent(
        `${target_user ? target_user : userDetails?.username}#${chatId}`,
      );
      const target_user_param = target_user
        ? `&target_user=${target_user}`
        : "";

      const res = await api.get(
        `${url}?identifier=${identifier}${target_user_param}`,
      );

      if (!res.data?.success) {
        updatedMessages.push(msgs[i]);
        console.log("Key not found for message id : ", msgs[i]._id);
        continue;
      }

      const key = res.data?.item?.key ?? "";

      // -------------get key : END-----------------

      let updatedMedias = [];

      for (let j = 0; j < medias.length; j++) {
        let endpoint = `${medias[j]}`;

        const res = await axios.get(endpoint);

        if (res.status !== 200) continue;

        const encrypted = res.data;

        const decryptedFile = await E2EHelper.decryptFile(
          key,
          encrypted?.cipherText,
          encrypted?.iv,
          encrypted?.fileName,
          encrypted?.mimeType,
        );

        updatedMedias.push(decryptedFile);
      }

      const modifiedMsg = {
        ...msgs[i],
        body: {
          ...msgs[i].body,
          media_url: updatedMedias,
        },
      };

      updatedMessages.push(modifiedMsg);
    }

    return updatedMessages;
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
        Notification.error("Something went wrong");
        return;
      }

      const updatedMsgs = await mediaDecryptor(response.data?.data?.messages);

      addChats(updatedMsgs);
    } catch (error) {
      Notification.error("something went wrong");
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
        Notification.error("Something went wrong");
        return;
      }

      const updatedMsgs = await mediaDecryptor(response.data?.data?.messages);

      addChats(updatedMsgs);
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

  const fetchByTags = async () => {
    try {
      if (!chatId) return;

      const target_user = targetUserDetails?.user_id
        ? `&target_user=${targetUserDetails?.user_id}`
        : "";

      const response = await api.get(
        `${ENDPOINTS.TAGS.GET}?for=${chatId.includes("group") ? "GROUP" : "DM"}&tag_id=${triggerPayload?.tag}&scope_id=${encodeURIComponent(chatId)}${target_user}`,
      );

      if (!response.data?.success) {
        Notification.error("Something went wrong");
        return;
      }

      addChats(response.data?.data?.messages ?? []);
    } catch (error) {
      Notification.error("something went wrong");
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
        return <EncryptedChatCard key={msg._id} msg={msg} />;
      } else {
        return (
          <MessageChat key={msg._id} msg={msg} onReplyClick={scrollToMessage} />
        );
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
          return conditionalRenderer.msgCardProvider(msg);
        })}
      </Stack>
    </ScrollArea>
  );
}
