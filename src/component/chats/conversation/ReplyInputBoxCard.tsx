import { CloseIcon } from "@mantine/core";
import {
  IconBrandYoutube,
  IconCode,
  IconFiles,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
  IconPhoto,
} from "@tabler/icons-react";
import { useExtentionMediaProvider } from "../../../hooks/useExtentionMediaProvider";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";

function ReplyInputBoxCard() {
  const getMediaType = useExtentionMediaProvider();
  const { trigger, triggerPayload, resetTrigger } = useTriggerStore();

  const onClose = () => resetTrigger();

  if (trigger !== TRIGGERS.reply) return null;

  const mediaUrls = triggerPayload?.body?.media_url;
  const firstMedia = mediaUrls?.[0]?.name;

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
    <div className="bg-blue-200 rounded-xl m-2 p-2 border-l-3 border-blue-700">
      <div className="flex items-center">
        <div className="font-medium text-sm">{triggerPayload?.created_by}</div>
        <div className="ms-auto">
          <CloseIcon size="20" color="blue" onClick={onClose} />
        </div>
      </div>
      <div className="w-90 flex items-center gap-2">
        <div>{mediaUrls?.length ? mediaIcon : null}</div>
        <div className="text-[12px] truncate text-nowrap text-gray-700">
          {triggerPayload?.body?.text}
        </div>
      </div>
    </div>
  );
}

export default ReplyInputBoxCard;
