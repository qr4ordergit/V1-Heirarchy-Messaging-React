import {
  IconBrandYoutube,
  IconCode,
  IconFiles,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
  IconPaperclip,
  IconPhoto,
} from "@tabler/icons-react";
import { useExtentionMediaProvider } from "../../../hooks/useExtentionMediaProvider";
import { useChatStore } from "../../../store/chats/chats.store";

interface REPLYCHAT {
  replied_to: string;
  onReplyClick: (messageId: string) => void;
}

function ReplyChat({ replied_to, onReplyClick }: REPLYCHAT) {
  const getMediaType = useExtentionMediaProvider();
  const { chats } = useChatStore();

  const repliedChat = chats.find((chat) => chat._id === replied_to);

  if (!repliedChat) return null;

  const mediaUrls = repliedChat.body?.media_url;
  const firstMedia = mediaUrls?.[0];

  const mediaType = firstMedia ? getMediaType(firstMedia) : null;

  const mediaIcons = {
    image: <IconPhoto stroke={2} color="blue" size={20} />,
    video: <IconBrandYoutube stroke={2} color="blue" size={20} />,
    document: <IconFileTypeDoc stroke={2} color="blue" size={20} />,
    pdf: <IconFileTypePdf stroke={2} color="blue" size={20} />,
    excel: <IconFileTypeXls stroke={2} color="blue" size={20} />,
    code: <IconCode stroke={2} color="blue" size={20} />,
    json: <IconJson stroke={2} color="blue" size={20} />,
  };

  const mediaIcon =
    mediaUrls && mediaUrls.length > 1 ? (
      <IconFiles stroke={2} color="blue" size={20} />
    ) : mediaType ? (
      mediaIcons[mediaType as keyof typeof mediaIcons]
    ) : null;

  return (
    <div
      className="bg-blue-200 rounded-xl mb-1 p-2 border-l-3 border-blue-800 cursor-pointer"
      onClick={() => onReplyClick(replied_to)}
    >
      <div className="flex items-center">
        <div className="font-medium text-sm">{repliedChat.created_by}</div>
        <div className="ms-auto"></div>
      </div>
      <div className="w-90 flex items-center gap-2">
        {mediaUrls?.length ? (
          <>
            <IconPaperclip color="gray" size={14} />
            {mediaIcon}
          </>
        ) : null}

        <div className="text-[12px] truncate text-nowrap text-gray-700">
          {repliedChat.body?.text}
        </div>
      </div>
    </div>
  );
}

export default ReplyChat;
