import { Image } from "@mantine/core";
import {
  IconCode,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
  IconZip,
} from "@tabler/icons-react";
import type { MESSAGE_MEDIA } from "../../../store/chats/chats.store";
import { useMemo } from "react";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";

interface MEDIACHAT {
  media_data: MESSAGE_MEDIA;
}

export function MediaChat({ media_data }: MEDIACHAT) {
  const { setTrigger } = useTriggerStore((state) => state);

  const fileUrl = useMemo(() => {
    if (typeof media_data.media_url === "string") {
      return media_data.media_url;
    } else {
      return URL.createObjectURL(media_data.media_url);
    }
  }, []);

  const mediaIcons = useMemo(() => {
    return {
      document: IconFileTypeDoc,
      pdf: IconFileTypePdf,
      excel: IconFileTypeXls,
      json: IconJson,
      code: IconCode,
      zip: IconZip,
    };
  }, []);

  const DocumentIcon =
    mediaIcons[media_data.media_details.type as keyof typeof mediaIcons];

  const onPreview = () => {
    setTrigger({
      toTrigger: TRIGGERS.previewMedia,
      payload: {
        src: fileUrl,
        type: media_data.media_details.type,
      },
    });
  };

  return (
    <div className="mb-1">
      <div>
        {/* Image */}
        {media_data.media_details.type === "image" && (
          <Image
            key={fileUrl}
            radius="md"
            h={"120px"}
            w={"120px"}
            src={fileUrl}
            onClick={onPreview}
          />
        )}

        {media_data.media_details.type === "video" && (
          <video
            src={fileUrl}
            className="w-30 h-30 object-cover rounded-lg"
            preload="metadata"
            onClick={onPreview}
          />
        )}
      </div>

      {/* documents */}
      {DocumentIcon && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {" "}
          <div className="bg-blue-950 h-30 w-30 rounded-md relative">
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
