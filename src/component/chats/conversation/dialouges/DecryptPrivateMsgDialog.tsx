import {
  Button,
  Flex,
  Group,
  Loader,
  Modal,
  PasswordInput,
  PinInput,
  SegmentedControl,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { Notification } from "../../../../utils/notification";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useParams } from "react-router";
import { useEffect, useReducer, useState, useTransition } from "react";
import { useChatStore } from "../../../../store/chats/chats.store";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { useTranslation } from "../../../../store/language/language.store";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import usePasswordManager, {
  type KEYRINGPASSWORD,
} from "../../../../store/keys/password.manager.store";

interface DECRYPT_PAYLOAD {
  [key: string]: unknown;
}

type RENDER = null | "OTP" | "LABELS";
type TAB = "MANUAL PASSWORD" | "KEYRING";
interface STATE {
  tab: TAB;
  selectedCategory: string | null;
  password: string;
  selectedPasswordLabel: string | null;
  render: RENDER;
  otp: string;
}

interface SUBMIT_PAYLOAD {
  users: string[];
  keyring_category_name?: string;
  keyring_password_key?: string;
  user_key: string;
}

const initialState: STATE = {
  tab: "MANUAL PASSWORD",
  selectedCategory: null,
  password: "",
  selectedPasswordLabel: null,
  render: null,
  otp: "",
};

function DecryptPrivateMsgDialog() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { updateDecryptedMsg } = useChatStore((state) => state);
  const { storeKeyringPasswords, keyringPasswords, updateKeyRingPassword } =
    usePasswordManager((state) => state);

  const { chatId } = useParams<{ chatId: string }>();
  const { target_user } = useAuthStore((state) => state);
  const { translation } = useTranslation();

  const [password, setPassword] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [passwordLabels, setPasswordLabels] = useState<string[]>([]);
  const [isOtpInvalid, setIsOtpInvalid] = useState<boolean>(false);

  const [decryptLoader1, DecryptFn1] = useTransition();
  const [decryptLoader2, DecryptFn2] = useTransition();
  const [keyRingLoader, KeyRingFn] = useTransition();
  const [verifyLoader, VerifyFn] = useTransition();

  const controller = new AbortController();

  // ---------------reducer : START----------------------

  type STATE_ACTION =
    | { type: "RESET" }
    | { type: "SET_TAB"; payload: TAB }
    | { type: "SET_CATEGORY"; payload: string | null }
    | { type: "SET_PASSWORD_LABEL"; payload: string | null }
    | { type: "SET_PASSWORD"; payload: string }
    | { type: "SET_RENDER"; payload: RENDER }
    | { type: "SET_OTP"; payload: string }
    | { type: "SET_SELECTED_MEMBERS"; payload: string[] };

  const stateReducer = (state: STATE, action: STATE_ACTION): STATE => {
    switch (action.type) {
      case "SET_TAB":
        return { ...state, tab: action.payload };

      case "SET_CATEGORY":
        return { ...state, selectedCategory: action.payload };

      case "SET_PASSWORD_LABEL":
        return { ...state, selectedPasswordLabel: action.payload };

      case "SET_PASSWORD":
        return { ...state, password: action.payload };

      case "SET_RENDER":
        return { ...state, render: action.payload };

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

  const fetchKeyRing = () => {
    KeyRingFn(async () => {
      const params = {
        target_user: target_user ? target_user : undefined,
      };

      try {
        const res = await api.get(ENDPOINTS.KEYRING_CATEGORIES.LIST, {
          params,
          signal: controller.signal,
        });

        if (res.data?.success) {
          storeKeyringPasswords(res.data?.data);

          const list = res.data?.data?.map(
            (p: KEYRINGPASSWORD) => p?.keyring_category_name,
          );

          setCategories(list);
        }
      } catch (error) {
        Notification.error(getApiErrorMessage(error));
      }
    });
  };

  const handleCategorySelect = (e: string | null) => {
    dispatch({ type: "SET_CATEGORY", payload: e });

    if (!e) {
      dispatch({ type: "SET_RENDER", payload: null });
      return;
    }

    const passwordsObj = keyringPasswords.find(
      (pass) => pass.keyring_category_name === e,
    )?.keyring_category_passwords;

    if (!passwordsObj) {
      setPasswordLabels([]);
      dispatch({ type: "SET_RENDER", payload: "OTP" });
      return;
    }

    const passwords = Object.keys(passwordsObj);
    setPasswordLabels(passwords);
    dispatch({ type: "SET_RENDER", payload: "LABELS" });
  };

  const handlePasswordLabelSelect = (e: string | null) => {
    dispatch({ type: "SET_PASSWORD_LABEL", payload: e });

    if (!e) return;

    const pass = keyringPasswords.find(
      (p) => p.keyring_category_name === state.selectedCategory,
    )?.keyring_category_passwords?.[e];

    if (!pass) return;

    dispatch({ type: "SET_PASSWORD", payload: pass });
  };

  const handleOtpChange = (e: string) => {
    dispatch({ type: "SET_OTP", payload: e });

    if (isOtpInvalid) {
      setIsOtpInvalid(false);
    }
  };

  const handleVerify = () => {
    VerifyFn(async () => {
      const cat_id = keyringPasswords.find(
        (cat) => cat.keyring_category_name === state.selectedCategory,
      )?._id;

      if (!cat_id) return;

      const params = {
        target_user: target_user ? target_user : undefined,
        keyring_category_id: cat_id,
        otp: state.otp,
      };

      try {
        const res = await api.get(ENDPOINTS.KEYRING_CATEGORIES.LIST, {
          params,
          signal: controller.signal,
        });

        if (!res.data?.is_valid_otp) {
          setIsOtpInvalid(true);
          return;
        }

        updateKeyRingPassword(res.data?.data);
        const keyAndPasswords = res.data?.data?.keyring_category_passwords;
        const keys = Object.keys(keyAndPasswords);

        if (keys.length === 0) return;

        setPasswordLabels(keys);
        dispatch({ type: "SET_RENDER", payload: "LABELS" });
      } catch (error) {
        Notification.error(getApiErrorMessage(error));
      }
    });
  };

  const onDecrypt = async (mode: string) => {
    if (mode === "manual" && password.trim().length < 1) {
      Notification.error("Password is mandatory");
      return;
    }

    try {
      const payload: DECRYPT_PAYLOAD = {
        message_id: triggerPayload?._id,
      };

      if (chatId?.includes("group")) {
        payload["group_id"] = chatId;
      } else {
        payload["chat_id"] = chatId;
      }

      if (mode === "manual") {
        payload["password"] = password;
      }

      const params = {
        target_user: target_user ? target_user : undefined,
      };

      const endpoint_url = chatId?.includes("group")
        ? ENDPOINTS.PRIVATEMSG.GROUP_DECRYPT
        : ENDPOINTS.PRIVATEMSG.DM_DECRYPT;
      const res = await api.post(endpoint_url, payload, { params });

      if (!res.data?.success && mode === "manual") {
        return;
      }

      if (!res.data?.success) {
        fetchKeyRing();
        return;
      }

      const finalMsgObj = res.data?.data;

      finalMsgObj["double_encryption"] = false;
      finalMsgObj["private_msg"] = true;
      updateDecryptedMsg(finalMsgObj);
      resetTrigger();
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
      if (mode === "manual") {
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
            <SegmentedControl
              fullWidth
              data={["MANUAL PASSWORD", "KEYRING"]}
              value={state.tab}
              onChange={(e) => dispatch({ type: "SET_TAB", payload: e })}
            />
            <div className="m-4">
              {state.tab === "MANUAL PASSWORD" && (
                <>
                  <PasswordInput
                    label="Manual Password"
                    placeholder="Enter password"
                    size="xs"
                    className="flex-1"
                    value={state.password}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_PASSWORD",
                        payload: e.target.value,
                      })
                    }
                    disabled={state.selectedCategory ? true : false}
                  />
                </>
              )}

              {state.tab === "KEYRING" && (
                <>
                  <Select
                    label="Keyring category"
                    placeholder="Select category"
                    size="xs"
                    data={categories}
                    searchable
                    clearable
                    loading={keyRingLoader}
                    readOnly={keyRingLoader}
                    onChange={(e) => handleCategorySelect(e)}
                    value={state.selectedCategory}
                  />
                  {state.render === "LABELS" && (
                    <Select
                      label="Password label"
                      placeholder="Select password label"
                      size="xs"
                      mt={"sm"}
                      data={passwordLabels}
                      searchable
                      clearable
                      loading={keyRingLoader}
                      readOnly={keyRingLoader}
                      onChange={(e) => handlePasswordLabelSelect(e)}
                      value={state.selectedPasswordLabel}
                    />
                  )}

                  {state.render === "OTP" && (
                    <div className="mt-2">
                      <Text size="xs" fw={500} mb={1}>
                        Enter OTP and verify
                      </Text>
                      <Flex gap={10} justify={"start"} align={"center"}>
                        <PinInput
                          type={"number"}
                          length={6}
                          size="xs"
                          value={state.otp}
                          onChange={handleOtpChange}
                          error={isOtpInvalid}
                        />
                        <Button
                          size="xs"
                          disabled={state.otp.length !== 6}
                          loaderProps={{ type: "dots" }}
                          loading={verifyLoader}
                          onClick={handleVerify}
                        >
                          Verify
                        </Button>
                      </Flex>
                      {isOtpInvalid && (
                        <Text
                          size="xs"
                          fw={500}
                          mb={1}
                          className="text-red-500"
                        >
                          Incorrect otp
                        </Text>
                      )}
                    </div>
                  )}
                </>
              )}

              <Flex mt={"md"} justify={"center"}>
                <Button
                  onClick={() => handleDecrypt("manual")}
                  size="xs"
                  disabled={state.password.trim().length < 5}
                  loading={decryptLoader2}
                  loaderProps={{ type: "dots" }}
                >
                  Submit
                </Button>
              </Flex>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DecryptPrivateMsgDialog;
