import DecryptPrivateMsgDialog from "../dialouges/DecryptPrivateMsgDialog";
import DeleteChatDialog from "../dialouges/DeleteChatDialog";
import EditChatDialog from "../dialouges/EditChatDialog";
import DisappearMsgsModal from "./DisappearMsgsModal";
import EditScheduleMsgModal from "./EditScheduleMsgModal";
import ExportChatModal from "./ExportChatModal";
import MsgSchedulerTimeModal from "./MsgSchedulerTimeModal";
import Previewer from "./Previewer";
import PrivateMessagePayloadModal from "./PrivateMessagePayloadModal";
import SchedularsPreviewModal from "./SchedularsPreviewModal";
import TagsModal from "./TagsModal";

function ChatModalsProvider() {
  return (
    <>
      <DeleteChatDialog />
      <EditChatDialog />
      <Previewer />
      <TagsModal />
      <PrivateMessagePayloadModal />
      <DecryptPrivateMsgDialog />
      <ExportChatModal />
      <DisappearMsgsModal />
      <MsgSchedulerTimeModal />
      <SchedularsPreviewModal />
      <EditScheduleMsgModal />
    </>
  );
}

export default ChatModalsProvider;
