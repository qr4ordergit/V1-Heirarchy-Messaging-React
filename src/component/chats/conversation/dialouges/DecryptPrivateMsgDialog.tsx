import { Button, Group, Loader, Modal, Text, TextInput } from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { Notification } from "../../../../utils/notification";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useParams } from "react-router";
import { useEffect, useState, useTransition } from "react";
import { useChatStore } from "../../../../store/chats/chats.store";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { useTranslation } from "../../../../store/language/language.store";

interface DECRYPT_PAYLOAD {
  [key: string]: unknown;
}

function DecryptPrivateMsgDialog() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { updateDecryptedMsg } = useChatStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { targetUserDetails } = useAuthStore((state) => state);
  const { translation } = useTranslation();

  const [password, setPassword] = useState<string>("");
  const [isPasswordIncorrect, setIsPasswordIncorrect] =
    useState<boolean>(false);

  const [decryptLoader1, DecryptFn1] = useTransition();
  const [decryptLoader2, DecryptFn2] = useTransition();

  const onClose = () => {
    resetTrigger();
  };

  const onDecrypt = async (mode: string) => {
    if (mode === "manual" && password.trim().length < 1) {
      Notification.error("Password is mandatory");
      return;
    }

    try {
      const payload: DECRYPT_PAYLOAD = {
        group_id: chatId,
        message_id: triggerPayload?._id,
      };

      if (mode === "manual") {
        payload["password"] = password;
      }

      const endpoint_url = targetUserDetails?.user_id
        ? `?target_user=${targetUserDetails?.user_id}`
        : "";
      const res = await api.post(
        `${ENDPOINTS.PRIVATEMSG.DECRYPT}${endpoint_url}`,
        payload,
      );

      if (!res.data?.success) {
        setIsPasswordIncorrect(true);
        return;
      }

      const finalMsgObj = res.data?.data;

      finalMsgObj["double_encryption"] = false;
      finalMsgObj["private_msg"] = true;
      updateDecryptedMsg(finalMsgObj);
      if (mode === "manual") {
        setPassword("");
      }
      resetTrigger();
    } catch (error) {
      console.log(error);
      if (mode === "manual") {
        Notification.error("Failed to decrypt message");
        resetTrigger();
      }
    }
  };

  const handleDecrypt = (mode: string) => {
    if (mode === "auto") {
      DecryptFn1(() => onDecrypt(mode));
    } else {
      DecryptFn2(() => onDecrypt(mode));
    }
  };

  useEffect(() => {
    if (trigger === TRIGGERS.decryptPrivateMsgDialog) {
      handleDecrypt("auto");
    }
  }, [trigger]);

  return (
    <Modal
      opened={trigger === TRIGGERS.decryptPrivateMsgDialog}
      onClose={onClose}
      title={translation(
        "chat_history.modal-decrypt-tile",
        "Decrypting message",
      )}
    >
      <div>
        {decryptLoader1 ? (
          <Group>
            <Loader color="blue" size={"sm"} />
            <Text>
              {translation(
                "chat_history.modal-decrypt-loading",
                "Message is decrypting... Please wait",
              )}
            </Text>
          </Group>
        ) : (
          <div>
            <Group align="flex-end">
              <TextInput
                readOnly={decryptLoader2}
                disabled={decryptLoader1}
                placeholder={translation(
                  "chat_history.modal-decrypt-ph1",
                  "Enter password",
                )}
                style={{ flex: 1 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordIncorrect(false)}
                error={isPasswordIncorrect}
              />
              <Button
                loading={decryptLoader2}
                disabled={decryptLoader1}
                loaderProps={{ type: "dots" }}
                onClick={() => handleDecrypt("manual")}
              >
                {translation("chat_history.modal-decrypt-btn", "Submit")}
              </Button>
            </Group>
            {isPasswordIncorrect && (
              <Text size="sm" className="text-red-500">
                {translation(
                  "chat_history.modal-decrypt-error-password",
                  "Incorrect password",
                )}
              </Text>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DecryptPrivateMsgDialog;
