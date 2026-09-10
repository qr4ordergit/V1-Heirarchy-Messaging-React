import { useParams } from "react-router";
import { useAuthStore } from "../store/auth/auth.store";
import type { MESSAGE } from "../store/chats/chats.store";
import { api } from "../api/axios";
import { E2EHelper } from "../utils/e2eHelper";

const useMediaDecryptor = () => {
    const { target_user, userDetails } = useAuthStore((state) => state);

    const { chatId } = useParams<{ chatId: string }>();

    return async function (msgs: MESSAGE[]): Promise<MESSAGE[]> {
        if (msgs.length === 0) {
            return [];
        }

        const updatedMessages: MESSAGE[] = [];

        for (let i = 0; i < msgs.length; i++) {
            const message = msgs[i];

            if (!message.body?.media_url || message.body.media_url.length === 0) {
                updatedMessages.push(message);
                continue;
            }

            const medias = message.body.media_url;

            const url =
                "https://u2hjtodeyl.execute-api.ap-south-1.amazonaws.com/dev/api/key-ring";

            const identifier = encodeURIComponent(
                `${target_user ? target_user : userDetails?.username}#${chatId}`,
            );

            const target_user_param = target_user
                ? `&target_user=${encodeURIComponent(target_user)}`
                : "";

            let key = "";

            try {
                const keyResponse = await api.get(
                    `${url}?identifier=${identifier}${target_user_param}`,
                );

                if (!keyResponse.data?.success) {
                    console.log("Key not found for message id:", message._id);

                    updatedMessages.push(message);
                    continue;
                }

                key = keyResponse.data?.item?.key ?? "";

                if (!key) {
                    console.log("Encryption key is empty for message id:", message._id);

                    updatedMessages.push(message);

                    continue;
                }
            } catch (error) {
                console.error("Failed to get encryption key:", error);

                updatedMessages.push(message);

                continue;
            }

            const updatedMedias: File[] = [];

            for (let j = 0; j < medias.length; j++) {
                const mediaUrl = medias[j];

                try {
                    if (typeof mediaUrl !== "string") {
                        continue;
                    }

                    const fileName = getFileNameFromUrl(mediaUrl);

                    const fileType = getFileType(fileName);

                    const decryptedFile = await E2EHelper.decryptMediaFromUrl(
                        mediaUrl,
                        key,
                        fileName,
                        fileType,
                    );

                    updatedMedias.push(decryptedFile);
                } catch (error) {
                    console.error(
                        `Failed to decrypt media ${j} for message ${message._id}:`,
                        error,
                    );
                }
            }

            const modifiedMsg: MESSAGE = {
                ...message,

                body: {
                    ...message.body,

                    media_url: updatedMedias,
                },
            };

            updatedMessages.push(modifiedMsg);
        }

        return updatedMessages;
    };
};

const getFileNameFromUrl = (url: string): string => {
    try {
        const parsedUrl = new URL(url);

        const pathname = decodeURIComponent(parsedUrl.pathname);

        const fileName = pathname.split("/").pop();

        return fileName || "encrypted-media";
    } catch {
        return "encrypted-media";
    }
};

const getFileType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",

        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        avi: "video/x-msvideo",

        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",

        pdf: "application/pdf",

        txt: "text/plain",

        json: "application/json",

        doc: "application/msword",

        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        xls: "application/vnd.ms-excel",

        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    return mimeTypes[extension ?? ""] ?? "application/octet-stream";
};

export default useMediaDecryptor;
