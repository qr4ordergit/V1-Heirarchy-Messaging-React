import { useEffect, useMemo } from "react";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import ChatInput from "./ChatInput";
import Chatting from "./Chatting";
import Navbar from "./Navbar";
import TextFilterInputBox from "./TextFilterInputBox";
import { api } from "../../../api/axios";
import { API_ENDPOINTS, withTargetUser } from "../../../utils/constant";
import useContactStore from "../../../store/contacts/contacts.store";
import { useAuthStore } from "../../../store/auth/auth.store";
import { useParams } from "react-router";
import { ENDPOINTS } from "../../../api/endpoints";
import { useTagStore } from "../../../store/tags/tags.store";
import ChatModalsProvider from "./modals/ChatModalsProvider";
import { getApiErrorMessage } from "../../../api/getApiErrorMessage";
import { Notification } from "../../../utils/notification";
import dayjs from "dayjs";
import { useChatStore } from "../../../store/chats/chats.store";
import { useTranslation } from "../../../store/language/language.store";

function Conversation() {
  const { trigger } = useTriggerStore((state) => state);
  const { storeContacts, contacts } = useContactStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { storeCategoryTags } = useTagStore((state) => state);
  const { current_chat } = useChatStore((state) => state);
  const { translation } = useTranslation();

  const fetchTagsList = async () => {
    try {
      const tagsByCategories = {
        group: [],
        user: [],
      };

      const params = {
        target_user: target_user ? target_user : undefined,
        group_id: chatId?.includes("group") ? chatId : undefined,
      };

      if (chatId?.includes("group")) {
        const res1 = await api.get(ENDPOINTS.TAG.GET, {
          params,
        });
        const group_tags = res1.data?.tag_ids || [];

        tagsByCategories.group = group_tags;
      }

      delete params.group_id;
      const res2 = await api.get(ENDPOINTS.TAG.GET, {
        params,
      });

      const newTags = res2.data?.tag_ids || [];

      tagsByCategories.user = newTags;

      storeCategoryTags(tagsByCategories);
    } catch (error: any) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const fetchContacts = async () => {
    if (contacts.length > 0) return;
    try {
      const response = await api.get(withTargetUser(API_ENDPOINTS.CONTACTS));

      if (response.data?.success) {
        storeContacts(response.data?.contacts);
      }
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const disappearingMsgModeChecker = () => {
    if (current_chat?.disappearing_messages?.enabled) {
      return true;
    } else {
      return false;
    }
  };

  const disappearingMode = useMemo(disappearingMsgModeChecker, [current_chat]);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    fetchTagsList();
  }, [chatId]);

  return (
    <div className="p-2 h-full">
      <div className="h-full rounded p-1">
        <div className="flex justify-center h-full">
          <div className="w-full lg:w-8/12">
            <div className="flex flex-col h-full">
              <Navbar />
              {disappearingMode && (
                <div className="text-center text-gray-400 text-[12px]">
                  {translation(
                    "chat_history.disappearing-active-text",
                    "Disappearing messages mode enabled on",
                  )}{" "}
                  {dayjs
                    .utc(current_chat.disappearing_messages?.updated_at)
                    .local()
                    .format("DD MMM YYYY hh:mm A")}
                </div>
              )}
              <div className="flex-1 min-h-0">
                <Chatting />
              </div>
              <div>
                {trigger.includes("search:") ? (
                  <TextFilterInputBox />
                ) : (
                  <ChatInput />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatModalsProvider />
    </div>
  );
}

export default Conversation;
