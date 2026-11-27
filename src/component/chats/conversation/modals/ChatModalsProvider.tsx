import DecryptPrivateMsgDialog from "../dialouges/DecryptPrivateMsgDialog";
import DeleteChatDialog from "../dialouges/DeleteChatDialog";
import EditChatDialog from "../dialouges/EditChatDialog";
import ChatPasswordModal from "./ChatPasswordModal";
import DisappearMsgsModal from "./DisappearMsgsModal";
import EditScheduleMsgModal from "./EditScheduleMsgModal";
import ExportChatModal from "./ExportChatModal";
import GroupInfoModal from "./GroupInfoModal";
import MsgSchedulerTimeModal from "./MsgSchedulerTimeModal";
import Previewer from "./Previewer";
import PrivateMessagePayloadModal from "./PrivateMessagePayloadModal";
import SchedularsPreviewModal from "./SchedularsPreviewModal";
import AddTagsForNewMsgModal from "./Tags/AddTagsForNewMsgModal";
import TagsModal from "./Tags/TagsModal";

function ChatModalsProvider() {
  return (
    <>
      <DeleteChatDialog />
      <EditChatDialog />
      <TagsModal />
      <PrivateMessagePayloadModal />
      <DecryptPrivateMsgDialog />
      <ExportChatModal />
      <DisappearMsgsModal />
      <MsgSchedulerTimeModal />
      <SchedularsPreviewModal />
      <EditScheduleMsgModal />
      <ChatPasswordModal />
      <GroupInfoModal />
      <Previewer />
      <AddTagsForNewMsgModal />
    </>
  );
}

export default ChatModalsProvider;
