import { Image } from "@mantine/core";
import { useExtentionMediaProvider } from "../../../hooks/useExtentionMediaProvider";
import {
  IconCode,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
} from "@tabler/icons-react";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";

interface MEDIACHAT {
  url: string;
  msg: MESSAGE;
}

export function MediaChat({ url, msg }: MEDIACHAT) {
  const getMediaType = useExtentionMediaProvider();
  const { setTrigger } = useTriggerStore();

  const mediaType = getMediaType(url);

  if (!mediaType) return null;

  const mediaIcons = {
    document: IconFileTypeDoc,
    pdf: IconFileTypePdf,
    excel: IconFileTypeXls,
    json: IconJson,
    code: IconCode,
  };

  const DocumentIcon = mediaIcons[mediaType as keyof typeof mediaIcons];

  const onPreview = () => {
    setTrigger({
      toTrigger: TRIGGERS.previewMedia,
      payload: msg,
    });
  };

  return (
    <div className="mb-1">
      <div>
        {/* Image */}
        {mediaType === "image" && (
          <Image
            key={url}
            radius="md"
            h={"30vh"}
            src={url}
            onClick={onPreview}
          />
        )}

        {mediaType === "video" && (
          <video
            src={url}
            className="w-52 object-cover rounded-lg"
            preload="metadata"
            onClick={onPreview}
          />
        )}
      </div>

      {/* documents */}
      {DocumentIcon && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {" "}
          <div className="bg-blue-950 h-32 w-32 rounded-md relative">
            {" "}
            <DocumentIcon
              stroke={2}
              color="white"
              size={40}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />{" "}
          </div>{" "}
        </a>
      )}
    </div>
  );
}
