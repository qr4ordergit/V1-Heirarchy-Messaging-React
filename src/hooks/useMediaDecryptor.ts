import { useParams } from "react-router";
import { useAuthStore } from "../store/auth/auth.store";
import type { MESSAGE } from "../store/chats/chats.store";
import { api } from "../api/axios";
import axios from "axios";
import { E2EHelper } from "../utils/e2eHelper";

const useMediaDecryptor = () => {
    const { target_user, userDetails } = useAuthStore((state) => state)
    const { chatId } = useParams<{ chatId: string }>()

    return async function (msgs: MESSAGE[]): Promise<MESSAGE[]> {
        if (msgs.length === 0) return [];

        let updatedMessages = [];

        for (let i = 0; i < msgs.length; i++) {
            if (!msgs[i].body?.media_url) {
                updatedMessages.push(msgs[i]);
                continue;
            }

            let medias = msgs[i].body?.media_url;

            if (!medias) continue;

            // -------------get key : START-----------------
            const url =
                "https://u2hjtodeyl.execute-api.ap-south-1.amazonaws.com/dev/api/key-ring";
            const identifier = encodeURIComponent(
                `${target_user ? target_user : userDetails?.username}#${chatId}`,
            );
            const target_user_param = target_user
                ? `&target_user=${target_user}`
                : "";

            const res = await api.get(
                `${url}?identifier=${identifier}${target_user_param}`,
            );

            if (!res.data?.success) {
                updatedMessages.push(msgs[i]);
                console.log("Key not found for message id : ", msgs[i]._id);
                continue;
            }

            const key = res.data?.item?.key ?? "";

            // -------------get key : END-----------------

            let updatedMedias = [];

            for (let j = 0; j < medias.length; j++) {
                let endpoint = `${medias[j]}`;

                const res = await axios.get(endpoint);

                if (res.status !== 200) continue;

                const encrypted = res.data;

                const decryptedFile = await E2EHelper.decryptFile(
                    key,
                    encrypted?.cipherText,
                    encrypted?.iv,
                    encrypted?.fileName,
                    encrypted?.mimeType,
                );

                updatedMedias.push(decryptedFile);
            }

            const modifiedMsg = {
                ...msgs[i],
                body: {
                    ...msgs[i].body,
                    media_url: updatedMedias,
                },
            };

            updatedMessages.push(modifiedMsg);
        }

        return updatedMessages;
    }
}

export default useMediaDecryptor