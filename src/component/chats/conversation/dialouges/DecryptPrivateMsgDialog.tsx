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

interface DECRYPT_PAYLOAD {
  [key: string]: unknown;
}

type RENDER = "MANUAL PASSWORD" | "OTP" | "UNAUTHORIZED" | null;
interface STATE {
  render: RENDER;
  password: string;
  otp: string;
}

const initialState: STATE = {
  render: null,
  password: "",
  otp: "",
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

  // ---------------reducer : START----------------------

  type STATE_ACTION =
    | { type: "RESET" }
    | { type: "SET_RENDER"; payload: RENDER }
    | { type: "SET_PASSWORD"; payload: string }
    | { type: "SET_OTP"; payload: string };

  const stateReducer = (state: STATE, action: STATE_ACTION): STATE => {
    switch (action.type) {
      case "SET_RENDER":
        return { ...state, render: action.payload };

      case "SET_PASSWORD":
        return { ...state, password: action.payload };

      case "SET_OTP":
        return { ...state, otp: action.payload };

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

  useEffect(() => {
    if (trigger === TRIGGERS.decryptPrivateMsgDialog) {
      handleDecrypt("auto");
    }

    return () => {
      controller.abort();
      dispatch({ type: "RESET" });
    };
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
              {!state.render ||
                (state.render !== "UNAUTHORIZED" && (
                  <Flex mt={"md"} justify={"center"}>
                    <Button
                      onClick={() => handleDecrypt("manual")}
                      size="xs"
                      disabled={
                        state.password.trim().length < 5 &&
                        state.otp.length !== 6
                      }
                      loading={decryptLoader2}
                      loaderProps={{ type: "dots" }}
                    >
                      {translation("chat_history.modal-decrypt-btn1", "Submit")}
                    </Button>
                  </Flex>
                ))}

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
