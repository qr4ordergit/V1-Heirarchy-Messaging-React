import { useEffect } from "react";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import ChatInput from "./ChatInput";
import Chatting from "./Chatting";
import DeleteChatDialog from "./dialouges/DeleteChatDialog";
import EditChatDialog from "./dialouges/EditChatDialog";
import Previewer from "./modals/Previewer";
import TagsModal from "./modals/TagsModal";
import Navbar from "./Navbar";
import TextFilterInputBox from "./TextFilterInputBox";
import PrivateMessagePayloadModal from "./modals/PrivateMessagePayloadModal";
import DecryptPrivateMsgDialog from "./dialouges/DecryptPrivateMsgDialog";
import { api } from "../../../api/axios";
import { API_ENDPOINTS, withTargetUser } from "../../../utils/constant";
import useContactStore from "../../../store/contacts/contacts.store";
import { useAuthStore } from "../../../store/auth/auth.store";
import { useParams } from "react-router";
import { ENDPOINTS } from "../../../api/endpoints";
import { useTagStore } from "../../../store/tags/tags.store";

function Conversation() {
  const { trigger } = useTriggerStore((state) => state);
  const { storeContacts } = useContactStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { storeCategoryTags } = useTagStore((state) => state);

  const fetchTagsList = async () => {
    try {
      const tagsByCategories = {
        group: [],
        user: [],
      };

      const params = {
        target_user,
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
      console.log(error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await api.get(withTargetUser(API_ENDPOINTS.CONTACTS));

      if (response.data?.success) {
        storeContacts(response.data?.contacts);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchTagsList();
    fetchContacts();
  }, []);

  return (
    <div className="p-2 h-full">
      <div className="h-full rounded p-1">
        <div className="flex justify-center h-full">
          <div className="w-full lg:w-8/12">
            <div className="flex flex-col h-full">
              <Navbar />
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
      <DeleteChatDialog />
      <EditChatDialog />
      <Previewer />
      <TagsModal />
      <PrivateMessagePayloadModal />
      <DecryptPrivateMsgDialog />
    </div>
  );
}

export default Conversation;
