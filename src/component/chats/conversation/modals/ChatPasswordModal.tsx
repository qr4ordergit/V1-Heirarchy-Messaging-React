import {
  Button,
  Divider,
  Fieldset,
  Flex,
  Group,
  Modal,
  PasswordInput,
  PinInput,
  Select,
  Text,
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

type FIELD = "KEY" | "OTP" | null;

function ChatPasswordModal() {
  const { trigger, resetTrigger, setTrigger } = useTriggerStore(
    (state) => state,
  );
  const { target_user, userDetails } = useAuthStore((state) => state);
  const navigate = useNavigate();
  const { current_chat } = useChatStore((state) => state);
  const { storeKeyringPasswords, keyringPasswords, updateKeyRingPassword } =
    usePasswordManager((state) => state);

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
  const [renderField, setRenderField] = useState<FIELD>(null);
  const [otp, setOtp] = useState<string>("");

  const [keyRingLoader, KeyRingFn] = useTransition();
  const [verifyLoader, VerifyFn] = useTransition();
  const [apiPolling, setApiPolling] = useState<boolean>(false);
  const [pollingAttempt, setPollingAttempt] = useState<number>(0);

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

    const keyAndPasswords = passObj.keyring_category_passwords;

    if (!keyAndPasswords) {
      setRenderField("OTP");
      return;
    }

    const keys = Object.keys(keyAndPasswords);

    setKeyRingCategoryKeys(keys);
    setRenderField("KEY");

    if (!user_id) return;
    const preferredKey = current_chat.is_locked?.[user_id]?.pass_label;

    setselectedKeyRingCategoryKey(preferredKey || null);
  };

  const initialActions = () => {
    !isPasswordManual && fetchKeyRing();
  };

  const handleVerify = () => {
    VerifyFn(async () => {
      if (otp.length !== 6) {
        Notification.error("OTP must have 6 digits");
        return;
      }

      const params = {
        target_user: target_user ? target_user : undefined,
        keyring_category_id: selectedKeyRingCategory,
        otp: otp,
      };

      try {
        const res = await api.get(ENDPOINTS.KEYRING_CATEGORIES.LIST, {
          params,
        });

        if (!res.data?.is_valid_otp) {
          Notification.error("OTP is invalid");
          return;
        }

        updateKeyRingPassword(res.data?.data);
        const keyAndPasswords = res.data?.data?.keyring_category_passwords;
        const keys = Object.keys(keyAndPasswords);

        setKeyRingCategoryKeys(keys);
        setRenderField("KEY");
      } catch (error) {
        Notification.error(getApiErrorMessage(error));
      }
    });
  };

  const handleSubmit = () => {
    if (isPasswordManual && manualPassword.trim().length === 0) {
      Notification.error("Enter password to chat");
      return;
    }

    if (
      !isPasswordManual &&
      (!selectedKeyRingCategory || !selectedKeyRingCategoryKey)
    ) {
      Notification.error("Select keyring category and category key to chat");
      return;
    }

    const payload: SUBMIT_PAYLOAD = {};

    if (isPasswordManual) {
      payload["user_key"] = manualPassword;
    } else {
      payload["keyring_category_id"] = selectedKeyRingCategory || "";
      payload["keyring_password_key"] = selectedKeyRingCategoryKey || "";

      if (!user_id) return;
      let passObj = keyringPasswords.find(
        (p) => p._id === selectedKeyRingCategory,
      );

      payload["user_key"] =
        passObj?.keyring_category_passwords[selectedKeyRingCategoryKey || ""];
    }

    setTrigger({
      toTrigger: TRIGGERS.chatPasswordPayload,
      payload: {
        ...payload,
      },
    });
  };

  const requestOtp = async () => {
    try {
      const payload = {
        keyring_category_id: selectedKeyRingCategory,
      };

      const params = {
        target_user: target_user ? target_user : undefined,
      };

      const res = await api.post(
        ENDPOINTS.KEYRING_CATEGORIES.REQ_OTP,
        payload,
        { params },
      );

      if (res.data?.status === "success") {
        setOtp(res.data?.otp);
        return "success";
      }

      if (res.data?.status === "rejected") {
        Notification.error("OTP request rejected");
        return "rejected";
      }

      return "repeat";
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  useEffect(() => {
    initialActions();
  }, []);

  useEffect(() => {
    if (!apiPolling) return;

    if (pollingAttempt >= 30) {
      setApiPolling(false);
      setPollingAttempt(0);
      return;
    }

    const timer = setTimeout(async () => {
      const status = await requestOtp();

      if (status === "success" || status === "rejected") {
        setApiPolling(false);
        setPollingAttempt(0);
        return;
      }

      setPollingAttempt((prev) => prev + 1);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [apiPolling, pollingAttempt]);

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
        <Divider my="md" label="OR" labelPosition="center" />
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
        {renderField === "KEY" && (
          <>
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
          </>
        )}

        {renderField !== "OTP" && (
          <Group justify="center" mt="md">
            <Button onClick={handleSubmit}>Submit</Button>
          </Group>
        )}

        {renderField === "OTP" && (
          <>
            <Text size="sm" fw={550} mt={"md"}>
              Verify 2FA OTP
            </Text>
            <Flex justify={"space-between"} wrap={"wrap"}>
              <PinInput
                type={"number"}
                length={6}
                value={otp}
                onChange={(e) => setOtp(e)}
              />
              <Button
                loading={verifyLoader}
                loaderProps={{ type: "dots" }}
                onClick={handleVerify}
              >
                Verify
              </Button>
            </Flex>
            {apiPolling ? (
              <Text size="xs" mt={"xs"} className="text-center">
                Requesting otp... Please wait
              </Text>
            ) : (
              <Text
                size="xs"
                mt={"xs"}
                td="underline"
                className="cursor-pointer text-center"
                onClick={() => setApiPolling(true)}
              >
                Get otp
              </Text>
            )}
          </>
        )}
      </Fieldset>
    </Modal>
  );
}

export default ChatPasswordModal;
