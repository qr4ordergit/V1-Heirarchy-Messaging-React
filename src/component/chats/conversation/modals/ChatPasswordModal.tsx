import {
  Button,
  Divider,
  Fieldset,
  Group,
  Modal,
  PasswordInput,
  Select,
} from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { useNavigate } from "react-router";
import { TRIGGERS } from "../../../../utils/constant";
import { useChatStore } from "../../../../store/chats/chats.store";
import { useEffect, useState, useTransition } from "react";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { Notification } from "../../../../utils/notification";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import usePasswordManager, {
  type KEYRINGPASSWORD,
} from "../../../../store/keys/password.manager.store";

interface SUBMIT_PAYLOAD {
  keyring_category_id?: string;
  keyring_password_key?: string;
  user_key?: string;
}

function ChatPasswordModal() {
  const { trigger, resetTrigger, setTrigger } = useTriggerStore(
    (state) => state,
  );
  const { target_user, userDetails } = useAuthStore((state) => state);
  const navigate = useNavigate();
  const { current_chat } = useChatStore((state) => state);
  const { storeKeyringPasswords, keyringPasswords } = usePasswordManager(
    (state) => state,
  );

  const user_id = target_user ? target_user : userDetails?.username;

  const isPasswordManual = user_id
    ? current_chat.is_locked?.[user_id]?.keyring_category_id
      ? false
      : true
    : false;

  const [manualPassword, setManualPassword] = useState<string>("");
  const [keyRingCategories, setKeyRIngCategories] = useState<string[]>([]);
  const [keyRingCategoryKeys, setKeyRingCategoryKeys] = useState<string[]>([]);
  const [selectedKeyRingCategory, setSelectedKeyRingCategory] = useState<
    string | null
  >(null);
  const [selectedKeyRingCategoryKey, setselectedKeyRingCategoryKey] = useState<
    string | null
  >(null);

  const [keyRingLoader, KeyRingFn] = useTransition();

  const onClose = () => {
    navigate("/chats");
    resetTrigger();
  };

  const fetchKeyRing = () => {
    KeyRingFn(async () => {
      const params = {
        target_user: target_user ? target_user : undefined,
      };

      try {
        const res = await api.get(ENDPOINTS.KEYRING_CATEGORIES.LIST, {
          params,
        });

        if (res.data?.success) {
          storeKeyringPasswords(res.data?.data);

          const list = res.data?.data?.map((p: KEYRINGPASSWORD) => {
            return {
              label: p?.keyring_category_name,
              value: p?._id,
            };
          });

          setKeyRIngCategories(list);
        }
      } catch (error) {
        Notification.error(getApiErrorMessage(error));
      }
    });
  };

  const handleChangeCategory = (e: null | string) => {
    setSelectedKeyRingCategory(e);
    let passObj = keyringPasswords.find((p) => p._id === e);

    if (!passObj) {
      setKeyRingCategoryKeys([]);
      return;
    }

    const keys = Object.keys(passObj.keyring_category_passwords);

    setKeyRingCategoryKeys(keys);
  };

  const initialActions = () => {
    !isPasswordManual && fetchKeyRing();
  };

  const handleSubmit = () => {
    if (manualPassword.trim().length === 0 && !selectedKeyRingCategory) {
      Notification.error("Select or enter password to chat");
      return;
    }

    const payload: SUBMIT_PAYLOAD = {};

    if (isPasswordManual) {
      payload["user_key"] = manualPassword;
    } else {
      ((payload["keyring_category_id"] = selectedKeyRingCategory || ""),
        (payload["keyring_password_key"] = selectedKeyRingCategoryKey || ""));
    }

    setTrigger({
      toTrigger: TRIGGERS.chatPasswordPayload,
      payload: {
        ...payload,
      },
    });
  };

  useEffect(() => {
    initialActions();
  }, []);

  return (
    <Modal
      opened={trigger === TRIGGERS.chatPasswordModal}
      onClose={onClose}
      withCloseButton={false}
      centered
    >
      <Fieldset legend="Enter or select password to chat">
        <PasswordInput
          label="Password"
          placeholder="Enter password"
          disabled={!isPasswordManual}
          value={manualPassword}
          onChange={(e) => setManualPassword(e.target.value)}
        />
        <Divider my="md" label="or" labelPosition="center" />
        <Select
          label="Keyring category"
          placeholder="Select"
          data={keyRingCategories}
          mt={"md"}
          disabled={isPasswordManual}
          loading={keyRingLoader}
          clearable
          searchable
          value={selectedKeyRingCategory}
          onChange={handleChangeCategory}
          nothingFoundMessage="Nothing found..."
        />
        <Select
          label="Category key"
          placeholder="Select"
          data={keyRingCategoryKeys}
          mt={"md"}
          loading={keyRingLoader}
          clearable
          searchable
          value={selectedKeyRingCategoryKey}
          onChange={(e) => setselectedKeyRingCategoryKey(e)}
          nothingFoundMessage="Nothing found..."
          disabled={isPasswordManual}
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={handleSubmit}>Submit</Button>
        </Group>
      </Fieldset>
    </Modal>
  );
}

export default ChatPasswordModal;
