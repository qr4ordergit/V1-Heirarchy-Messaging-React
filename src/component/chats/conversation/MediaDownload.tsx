import {
  IconBrandYoutube,
  IconCircleArrowDown,
  IconCode,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
  IconPhoto,
  IconZip,
} from "@tabler/icons-react";
import { useMemo, useTransition } from "react";
import {
  useChatStore,
  type MESSAGE_MEDIA,
} from "../../../store/chats/chats.store";
import { Flex, Loader } from "@mantine/core";
import formatFileSize from "../../../utils/formatFileSize";
import useSingleMediaDecryptor from "../../../hooks/useSingleMediaDecryptor";

interface PAYLOAD {
  msg_id: string;
  media_data: MESSAGE_MEDIA;
  mediaIndex: number;
}

function MediaDownload({ msg_id, media_data, mediaIndex }: PAYLOAD) {
  const decryptor = useSingleMediaDecryptor();
  const [loader, SubmitFn] = useTransition();
  const { decryptMediaUrlOfChat, enableDecryptedMediaOfChat } = useChatStore(
    (state) => state,
  );

  const mediaIcons = {
    document: IconFileTypeDoc,
    pdf: IconFileTypePdf,
    excel: IconFileTypeXls,
    json: IconJson,
    code: IconCode,
    zip: IconZip,
    image: IconPhoto,
    video: IconBrandYoutube,
  };

  const DocumentIcon = useMemo(
    () => mediaIcons[media_data.media_details.type as keyof typeof mediaIcons],
    [],
  );

  const onDecrypt = async () => {
    if (!media_data.media_details.isEncrypted) {
      enableDecryptedMediaOfChat(msg_id, mediaIndex);
    }
    const newUrl = await decryptor(msg_id, media_data.media_url);

    if (!newUrl) return;

    decryptMediaUrlOfChat(msg_id, newUrl, mediaIndex);
  };

  const handleDecrypt = () => {
    SubmitFn(onDecrypt);
  };

  return (
    <div>
      <div className="h-30 w-30 bg-gray-200 rounded relative">
        <div className="absolute top-1/2 left-1/2 -translate-1/2">
          <DocumentIcon size={26} />
        </div>
        <Flex
          className="absolute bottom-1 left-2 cursor-pointer"
          align={"center"}
          gap={2}
          onClick={handleDecrypt}
        >
          {loader ? (
            <Loader size={12} color="dark" />
          ) : (
            <IconCircleArrowDown size={14} />
          )}

          <div className="text-xs">
            {formatFileSize(media_data.media_details.total_size)}
          </div>
        </Flex>
      </div>
    </div>
  );
}

export default MediaDownload;
