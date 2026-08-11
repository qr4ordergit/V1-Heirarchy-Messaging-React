import { Image } from "@mantine/core";
import { useExtentionMediaProvider } from "../../../hooks/useExtentionMediaProvider";
import {
  IconCode,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
} from "@tabler/icons-react";

interface MEDIACHAT {
  url: string;
}

export function MediaChat({ url }: MEDIACHAT) {
  const getMediaType = useExtentionMediaProvider();

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

  return (
    <div className="mb-1">
      {/* Image */}
      {mediaType === "image" && (
        <Image key={url} radius="md" h={"30vh"} src={url} />
      )}

      {mediaType === "video" && (
        <video
          src={url}
          className="w-52 object-cover rounded-lg"
          preload="metadata"
        />
      )}

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
