import { useParams } from "react-router";
import { useAuthStore } from "../store/auth/auth.store";
import { api } from "../api/axios";
import { E2EHelper } from "../utils/e2eHelper";
import useKeyStore from "../store/keys/keys.store";

const useSingleMediaDecryptor = () => {
    const { target_user, userDetails } = useAuthStore((state) => state);
    const { keys, insertKey } = useKeyStore((state) => state)

    const { chatId } = useParams<{ chatId: string }>();

    return async function (msg_id: string, url: string | File): Promise<File | null> {

        if (typeof url !== "string") return null

        const endpoint =
            "https://u2hjtodeyl.execute-api.ap-south-1.amazonaws.com/dev/api/key-ring";

        const params = {
            identifier: `${target_user ? target_user : userDetails?.username}#${chatId}`,
            target_user: target_user ? target_user : undefined
        }

        try {
            let key = keys[msg_id]

            if (!key) {
                const keyResponse = await api.get(endpoint, { params });

                if (!keyResponse.data?.success) {
                    console.log("Key not found for message id:", msg_id);
                    return null
                }

                key = keyResponse.data?.item?.key ?? "";

                if (!key) {
                    console.log("Encryption key is empty for message id:", msg_id);
                    return null
                }

                insertKey({
                    id: msg_id,
                    key: key
                })
            }

            const fileName = getFileNameFromUrl(url);

            const fileType = getFileType(fileName);

            const decryptedFile = await E2EHelper.decryptMediaFromUrl(
                url,
                key,
                fileName,
                fileType,
            );

            return decryptedFile

        } catch (error) {
            console.error("Failed to get encryption key:", error);
            return null
        }
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

export default useSingleMediaDecryptor;
