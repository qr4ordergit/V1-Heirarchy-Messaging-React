import { Button, Dialog, Divider, Group, TextInput } from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { Notification } from "../../../../utils/notification";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useParams } from "react-router";
import { useState, useTransition } from "react";
import { useChatStore } from "../../../../store/chats/chats.store";

interface DECRYPT_PAYLOAD {
  [key: string]: unknown;
}

function DecryptPrivateMsgDialog() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { updateDecryptedMsg } = useChatStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();

  const [password, setPassword] = useState<string>("");

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

      const res = await api.post(ENDPOINTS.PRIVATEMSG.DECRYPT, payload);

      if (!res.data?.success) {
        Notification.error("Failed to decrypt message");
        return;
      }

      const finalMsgObj = res.data?.data;

      finalMsgObj["double_encryption"] = false;
      updateDecryptedMsg(finalMsgObj);
      if (mode === "manual") {
        setPassword("");
      }
      resetTrigger();
    } catch (error) {
      console.log(error);
      Notification.error("Failed to decrypt message");
      resetTrigger();
    }
  };

  const handleDecrypt = (mode: string) => {
    if (mode === "auto") {
      DecryptFn1(() => onDecrypt(mode));
    } else {
      DecryptFn2(() => onDecrypt(mode));
    }
  };
  return (
    <Dialog
      opened={trigger === TRIGGERS.decryptPrivateMsgDialog}
      withCloseButton
      onClose={onClose}
      size="lg"
      position={{ bottom: 20, right: 20 }}
    >
      <div>
        <Button
          onClick={() => handleDecrypt("auto")}
          loading={decryptLoader1}
          loaderProps={{ type: "dots" }}
        >
          Auto decrypt
        </Button>
        <Divider
          my="xs"
          label="or Decrypt With Password"
          labelPosition="left"
        />
        <Group align="flex-end">
          <TextInput
            readOnly={decryptLoader2}
            disabled={decryptLoader1}
            placeholder="Enter password"
            style={{ flex: 1 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            loading={decryptLoader2}
            disabled={decryptLoader1}
            loaderProps={{ type: "dots" }}
            onClick={() => handleDecrypt("manual")}
          >
            Submit
          </Button>
        </Group>
      </div>
    </Dialog>
  );
}

export default DecryptPrivateMsgDialog;
