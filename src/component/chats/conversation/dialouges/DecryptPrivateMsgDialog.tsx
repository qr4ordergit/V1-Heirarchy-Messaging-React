import {
  Alert,
  Button,
  Flex,
  Group,
  Loader,
  Modal,
  PasswordInput,
  PinInput,
  Text,
} from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { Notification } from "../../../../utils/notification";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useParams } from "react-router";
import {
  useEffect,
  useReducer,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useChatStore } from "../../../../store/chats/chats.store";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { useTranslation } from "../../../../store/language/language.store";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { IconCircleX } from "@tabler/icons-react";

interface DECRYPT_PAYLOAD {
  [key: string]: unknown;
}

type RENDER = "MANUAL PASSWORD" | "OTP" | "UNAUTHORIZED" | null;
type OTP_STATUS = "REJECTED" | null;
interface STATE {
  render: RENDER;
  password: string;
  otp: string;
  apiPolling: boolean;
  pollingAttempt: number;
  otpStatus: OTP_STATUS;
}

const initialState: STATE = {
  render: null,
  password: "",
  otp: "",
  apiPolling: false,
  pollingAttempt: 0,
  otpStatus: null,
};

function DecryptPrivateMsgDialog() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { updateDecryptedMsg } = useChatStore((state) => state);

  const { chatId } = useParams<{ chatId: string }>();
  const { target_user } = useAuthStore((state) => state);
  const { translation } = useTranslation();

  const [isOtpInvalid, setIsOtpInvalid] = useState<boolean>(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState<boolean>(false);

  const [decryptLoader1, DecryptFn1] = useTransition();
  const [decryptLoader2, DecryptFn2] = useTransition();

  const controller = new AbortController();
  let OTP_SESSION_TIME = 120000;
  const POLLING_INTERVAL = 3000;

  // ---------------reducer : START----------------------

  type STATE_ACTION =
    | { type: "RESET" }
    | { type: "SET_RENDER"; payload: RENDER }
    | { type: "SET_PASSWORD"; payload: string }
    | { type: "SET_OTP"; payload: string }
    | { type: "SET_POLLING"; payload: boolean }
    | { type: "SET_ATTEMPT"; payload: number }
    | { type: "SET_OTP_STATUS"; payload: OTP_STATUS };

  const stateReducer = (state: STATE, action: STATE_ACTION): STATE => {
    switch (action.type) {
      case "SET_RENDER":
        return { ...state, render: action.payload };

      case "SET_PASSWORD":
        return { ...state, password: action.payload };

      case "SET_OTP":
        return { ...state, otp: action.payload };

      case "SET_POLLING":
        return { ...state, apiPolling: action.payload };

      case "SET_ATTEMPT":
        return { ...state, pollingAttempt: action.payload };

      case "SET_OTP_STATUS":
        return { ...state, otpStatus: action.payload };

      case "RESET":
        return initialState;

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(stateReducer, initialState);

  // ---------------reducer : END----------------------

  const onClose = () => {
    resetTrigger();
  };

  const handleOtpChange = (e: string) => {
    dispatch({ type: "SET_OTP", payload: e });

    if (isOtpInvalid) {
      setIsOtpInvalid(false);
    }
  };

  const onDecrypt = async () => {
    try {
      const payload: DECRYPT_PAYLOAD = {
        message_id: triggerPayload?._id,
      };

      if (chatId?.includes("group")) {
        payload["group_id"] = chatId;
      } else {
        payload["chat_id"] = chatId;
      }

      if (state.render === "MANUAL PASSWORD") {
        payload["password"] = state.password;
      }

      if (state.render === "OTP") {
        payload["2fa-otp"] = state.otp;
      }

      const params = {
        target_user: target_user ? target_user : undefined,
      };

      const endpoint_url = chatId?.includes("group")
        ? ENDPOINTS.PRIVATEMSG.GROUP_DECRYPT
        : ENDPOINTS.PRIVATEMSG.DM_DECRYPT;
      const res = await api.post(endpoint_url, payload, { params });

      if (!res.data?.success && res.data?.password_required) {
        dispatch({ type: "SET_RENDER", payload: "MANUAL PASSWORD" });
        return;
      }

      if (!res.data?.success && res.data?.permission === false) {
        dispatch({ type: "SET_RENDER", payload: "UNAUTHORIZED" });
        setTimeout(() => {
          onClose();
        }, 5000);
        return;
      }

      if (!res.data?.success && state.password.trim().length > 5) {
        setIsPasswordInvalid(true);
        return;
      }

      if (!res.data?.success && state.otp.length === 6) {
        setIsOtpInvalid(true);
        return;
      }

      if (!res.data?.success && res.data?.pin_required) {
        dispatch({ type: "SET_RENDER", payload: "OTP" });
        return;
      }

      if (!res.data?.success && res.data?.pin_required) {
        dispatch({ type: "SET_RENDER", payload: "OTP" });
        return;
      }

      const finalMsgObj = res.data?.data;

      finalMsgObj["double_encryption"] = false;
      finalMsgObj["private_msg"] = true;
      updateDecryptedMsg(finalMsgObj);
      resetTrigger();
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const handleDecrypt = (mode: string) => {
    if (mode === "auto") {
      DecryptFn1(onDecrypt);
    } else {
      DecryptFn2(onDecrypt);
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "SET_PASSWORD",
      payload: e.target.value,
    });

    if (isPasswordInvalid) {
      setIsPasswordInvalid(false);
    }
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

  const requestOtpHandler = async () => {
    dispatch({ type: "SET_POLLING", payload: true });
    await getSessionTime();
  };

  const requestOtp = async () => {
    try {
      const payload = {
        keyring_category_id: triggerPayload?.keyring_category_id,
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
        dispatch({ type: "SET_OTP", payload: res.data?.otp });
        return "success";
      }

      if (res.data?.status === "rejected") {
        dispatch({ type: "SET_OTP_STATUS", payload: "REJECTED" });
        return "rejected";
      }

      return "repeat";
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const stopPolling = () => {
    dispatch({ type: "SET_POLLING", payload: false });
    dispatch({ type: "SET_ATTEMPT", payload: 0 });
  };

  useEffect(() => {
    if (trigger === TRIGGERS.decryptPrivateMsgDialog) {
      handleDecrypt("auto");
    }

    return () => {
      controller.abort();
      dispatch({ type: "RESET" });
    };
  }, [trigger]);

  useEffect(() => {
    if (!state.apiPolling) return;

    if (
      state.pollingAttempt >= Math.floor(OTP_SESSION_TIME / POLLING_INTERVAL)
    ) {
      stopPolling();
      return;
    }

    const timer = setTimeout(async () => {
      const status = await requestOtp();

      if (status === "success" || status === "rejected") {
        stopPolling();
        return;
      }

      dispatch({ type: "SET_ATTEMPT", payload: state.pollingAttempt + 1 });
    }, POLLING_INTERVAL);

    return () => {
      clearTimeout(timer);
    };
  }, [state.apiPolling, state.pollingAttempt]);

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
            <div className="m-2">
              {state.render === "MANUAL PASSWORD" && (
                <>
                  <PasswordInput
                    label={translation(
                      "chat_history.modal-decrypt-label1",
                      "Manual Password",
                    )}
                    placeholder={translation(
                      "chat_history.modal-decrypt-plh1",
                      "Enter password",
                    )}
                    size="xs"
                    className="flex-1"
                    value={state.password}
                    onChange={handlePasswordChange}
                  />
                </>
              )}

              {state.render === "OTP" && (
                <>
                  <div className="mt-2">
                    <Text size="xs" fw={500} mb={1} className="text-center">
                      {translation(
                        "chat_history.modal-decrypt-label2",
                        "Enter OTP",
                      )}
                    </Text>
                    <Flex gap={10} justify={"center"} align={"center"}>
                      <PinInput
                        type={"number"}
                        length={6}
                        size="xs"
                        value={state.otp}
                        onChange={handleOtpChange}
                        error={isOtpInvalid}
                      />
                    </Flex>
                    {isOtpInvalid && (
                      <Text
                        size="xs"
                        fw={500}
                        mb={1}
                        className="text-red-500 text-center"
                      >
                        {translation(
                          "chat_history.modal-decrypt-error1",
                          "Incorrect otp",
                        )}
                      </Text>
                    )}
                    {state.apiPolling ? (
                      <Flex
                        mt={"sm"}
                        justify={"center"}
                        align={"center"}
                        gap={2}
                      >
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
                            onClick={stopPolling}
                          />
                        </div>
                      </Flex>
                    ) : (
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
                  </div>
                </>
              )}

              {isPasswordInvalid && (
                <Text className="text-red-500" size="xs">
                  {translation(
                    "chat_history.modal-decrypt-error2",
                    "Incorrect password",
                  )}
                </Text>
              )}

              {state.otpStatus === "REJECTED" && (
                <Alert
                  variant="light"
                  color="red"
                  title={translation(
                    "chat_history.modal-alert-reject-title",
                    "OTP rejected",
                  )}
                  my={"sm"}
                >
                  {translation(
                    "chat_history.modal-alert-reject-content",
                    "Retry again or try after sometime.",
                  )}
                </Alert>
              )}

              {(!state.render || state.render !== "UNAUTHORIZED") && (
                <Flex mt={"md"} justify={"center"}>
                  <Button
                    onClick={() => handleDecrypt("manual")}
                    size="xs"
                    disabled={
                      state.password.trim().length < 5 && state.otp.length !== 6
                    }
                    loading={decryptLoader2}
                    loaderProps={{ type: "dots" }}
                  >
                    {translation("chat_history.modal-decrypt-btn1", "Submit")}
                  </Button>
                </Flex>
              )}

              {state.render === "UNAUTHORIZED" && (
                <Alert variant="light" color="red" title="Pemission denied">
                  {translation(
                    "chat_history.modal-decrypt-error3",
                    "You do not have the permission to decrypt this message",
                  )}
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DecryptPrivateMsgDialog;
