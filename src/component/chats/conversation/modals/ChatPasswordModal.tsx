import {
  Alert,
  Button,
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
import { useTranslation } from "../../../../store/language/language.store";
import { IconCircleX } from "@tabler/icons-react";

interface SUBMIT_PAYLOAD {
  keyring_category_id?: string;
  keyring_password_key?: string;
  user_key?: string;
}

type FIELD = "KEY" | "OTP" | null;
type ALERT_STATUS = "SUCCESS" | "REJECTED" | "PENDING" | "INVALID" | null;

const POLLING_INTERVAL = 3000;

function ChatPasswordModal() {
  const { trigger, resetTrigger, setTrigger } = useTriggerStore(
    (state) => state,
  );
  const { target_user, userDetails } = useAuthStore((state) => state);
  const navigate = useNavigate();
  const { current_chat } = useChatStore((state) => state);
  const { storeKeyringPasswords, keyringPasswords, updateKeyRingPassword } =
    usePasswordManager((state) => state);
  const { translation } = useTranslation();

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
  const [alertStatus, setAlertStatus] = useState<ALERT_STATUS>(null);

  const alerts = {
    SUCCESS: {
      color: "green",
      title: translation(
        "chat_history.modal-alert-success-title",
        "OTP received",
      ),
      content: translation(
        "chat_history.modal-alert-success-content",
        "Kindly verify to validate.",
      ),
    },
    REJECTED: {
      color: "red",
      title: translation(
        "chat_history.modal-alert-reject-title",
        "OTP rejected",
      ),
      content: translation(
        "chat_history.modal-alert-reject-content",
        "Retry again or try after sometime.",
      ),
    },
    PENDING: {
      color: "blue",
      title: translation(
        "chat_history.modal-alert-pending-title",
        "OTP approval pending",
      ),
      content: translation(
        "chat_history.modal-alert-pending-content",
        "Retry again or try after sometime.",
      ),
    },
    INVALID: {
      color: "red",
      title: translation(
        "chat_history.modal-alert-invalid-title",
        "Invalid otp",
      ),
      content: translation(
        "chat_history.modal-alert-invalid-content",
        "Kindly enter correct otp.",
      ),
    },
  };
  let OTP_SESSION_TIME = 120000;

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
    if (trigger !== TRIGGERS.chatPasswordModal) return;
    !isPasswordManual && fetchKeyRing();
  };

  const handleVerify = () => {
    setAlertStatus(null);
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
          setAlertStatus("INVALID");
          return;
        }

        updateKeyRingPassword(res.data?.data);
        const keyAndPasswords = res.data?.data?.keyring_category_passwords;
        const keys = Object.keys(keyAndPasswords);

        setKeyRingCategoryKeys(keys);
        setRenderField("KEY");

        if (!user_id) return;
        const preferredKey = current_chat.is_locked?.[user_id]?.pass_label;

        setselectedKeyRingCategoryKey(preferredKey || null);
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

  const getSessionTime = async () => {
    const params = {
      target_user: target_user ? target_user : undefined,
    };

    try {
      const res = await api.get(ENDPOINTS.KEYRING_CATEGORIES.GET_SESSION, {
        params,
      });

      if (res.data?.success) {
        OTP_SESSION_TIME = res.data?.data?.custom_totp_validity * 1000;
      }
    } catch (error) {
      console.log(error);
    }
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

      if (res.data?.status === "accepted") {
        setOtp(res.data?.otp);
        setAlertStatus("SUCCESS");
        return "success";
      }

      if (res.data?.status === "rejected") {
        setAlertStatus("REJECTED");
        return "rejected";
      }

      return "repeat";
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const requestOtpHandler = async () => {
    setApiPolling(true);
    setAlertStatus(null);
    await getSessionTime();
  };

  useEffect(() => {
    initialActions();
  }, [trigger]);

  useEffect(() => {
    if (!apiPolling) return;

    if (pollingAttempt >= Math.floor(OTP_SESSION_TIME / POLLING_INTERVAL)) {
      setApiPolling(false);
      setPollingAttempt(0);
      setAlertStatus("PENDING");
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
    }, POLLING_INTERVAL);

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
      radius={"lg"}
    >
      <Fieldset
        legend={translation(
          "chat_history.modal-chat-pass-legend",
          "Enter or select password to chat",
        )}
      >
        {isPasswordManual && (
          <PasswordInput
            label={translation(
              "chat_history.modal-chat-pass-label1",
              "Password",
            )}
            placeholder={translation(
              "chat_history.modal-chat-pass-plc1",
              "Enter password",
            )}
            disabled={!isPasswordManual}
            value={manualPassword}
            onChange={(e) => setManualPassword(e.target.value)}
            size="xs"
          />
        )}

        {!isPasswordManual && (
          <Select
            label={translation(
              "chat_history.modal-chat-pass-label2",
              "Keyring category",
            )}
            placeholder={translation(
              "chat_history.modal-chat-pass-plc2",
              "Select",
            )}
            data={keyRingCategories}
            disabled={isPasswordManual}
            readOnly={keyRingLoader}
            loading={keyRingLoader}
            clearable
            searchable
            value={selectedKeyRingCategory}
            onChange={handleChangeCategory}
            nothingFoundMessage="Nothing found..."
            size="xs"
          />
        )}
        {renderField === "KEY" && (
          <>
            <Select
              label={translation(
                "chat_history.modal-chat-pass-label3",
                "Category key",
              )}
              placeholder={translation(
                "chat_history.modal-chat-pass-plc3",
                "Select",
              )}
              data={keyRingCategoryKeys}
              mt={"md"}
              loading={keyRingLoader}
              clearable
              searchable
              value={selectedKeyRingCategoryKey}
              onChange={(e) => setselectedKeyRingCategoryKey(e)}
              nothingFoundMessage="Nothing found..."
              disabled={isPasswordManual}
              size="xs"
            />
          </>
        )}

        {renderField === "OTP" && (
          <>
            <Text size="sm" fw={550} mt={"md"}>
              {translation(
                "chat_history.modal-chat-pass-label-verify",
                "Verify 2FA OTP",
              )}
            </Text>
            <Flex justify={"space-between"} wrap={"wrap"}>
              <PinInput
                type={"number"}
                length={6}
                value={otp}
                onChange={(e) => setOtp(e)}
                size="xs"
              />
              <Button
                loading={verifyLoader}
                disabled={otp.length !== 6}
                loaderProps={{ type: "dots" }}
                onClick={handleVerify}
                size="xs"
              >
                {translation(
                  "chat_history.modal-chat-pass-btn-verify",
                  "Verify",
                )}
              </Button>
            </Flex>
            {apiPolling && (
              <Flex mt={"sm"} justify={"center"} align={"center"} gap={2}>
                <Text size="xs">
                  {translation(
                    "chat_history.modal-chat-pass-otp-loader",
                    "Requesting otp... Please wait",
                  )}
                </Text>
                <div>
                  <IconCircleX
                    size={20}
                    className="cursor-pointer"
                    onClick={() => {
                      setApiPolling(false);
                      setPollingAttempt(0);
                    }}
                  />
                </div>
              </Flex>
            )}

            {alertStatus && (
              <Alert
                variant="light"
                color={alerts[alertStatus].color}
                title={alerts[alertStatus].title}
                className="mt-2"
              >
                {alerts[alertStatus].content}
              </Alert>
            )}

            {!apiPolling && alertStatus !== "SUCCESS" && (
              <Text
                size="xs"
                mt={"xs"}
                td="underline"
                className="cursor-pointer text-center"
                onClick={requestOtpHandler}
              >
                {translation(
                  "chat_history.modal-chat-pass-link-verify",
                  "Get otp",
                )}
              </Text>
            )}
          </>
        )}

        {renderField !== "OTP" && (
          <Group justify="center" mt="md">
            <Button onClick={handleSubmit} size="xs">
              {translation("chat_history.modal-chat-pass-btn-submit", "Submit")}
            </Button>
          </Group>
        )}
      </Fieldset>
    </Modal>
  );
}

export default ChatPasswordModal;
