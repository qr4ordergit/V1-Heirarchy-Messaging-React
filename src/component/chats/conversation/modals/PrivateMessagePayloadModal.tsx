import {
  Button,
  Flex,
  Modal,
  MultiSelect,
  PasswordInput,
  PinInput,
  SegmentedControl,
  Select,
  Text,
} from "@mantine/core";
import { TRIGGERS } from "../../../../utils/constant";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { useEffect, useReducer, useState, useTransition } from "react";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { ENDPOINTS } from "../../../../api/endpoints";
import { api } from "../../../../api/axios";
import usePasswordManager, {
  type KEYRINGPASSWORD,
} from "../../../../store/keys/password.manager.store";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { Notification } from "../../../../utils/notification";
import { useNextPerson } from "../../../../hooks/useNextPerson";
import { useParams } from "react-router";
import useContactNameProvider from "../../../../hooks/useContactNameProvider";

type RENDER = null | "OTP" | "LABELS";
type TAB = "MANUAL PASSWORD" | "KEYRING";
interface STATE {
  tab: TAB;
  selectedCategory: string | null;
  password: string;
  selectedPasswordLabel: string | null;
  render: RENDER;
  otp: string;
  selectedMembers: string[];
}

interface SUBMIT_PAYLOAD {
  users: string[];
  keyring_category_id?: string;
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
  selectedMembers: [],
};

function PrivateMessagePayloadModal() {
  const { trigger, resetTrigger, setTrigger } = useTriggerStore(
    (state) => state,
  );
  const { target_user, userDetails } = useAuthStore((state) => state);
  const { storeKeyringPasswords, keyringPasswords, updateKeyRingPassword } =
    usePasswordManager((state) => state);

  const [categories, setCategories] = useState<string[]>([]);
  const [passwordLabels, setPasswordLabels] = useState<string[]>([]);
  const [isOtpInvalid, setIsOtpInvalid] = useState<boolean>(false);
  const [members, setMembers] = useState<{ label: string; value: string }[]>(
    [],
  );

  const [keyRingLoader, KeyRingFn] = useTransition();
  const [verifyLoader, VerifyFn] = useTransition();
  const [fetchMembersLoader, FetchMembersFn] = useTransition();

  const nextPerson = useNextPerson();
  const contactNameProvider = useContactNameProvider();
  const { chatId } = useParams<{ chatId: string }>();

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

      case "SET_SELECTED_MEMBERS":
        return { ...state, selectedMembers: action.payload };

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

  const handleSubmit = (type: string) => {
    const nextPersonId = nextPerson(chatId ?? "");

    const payload: SUBMIT_PAYLOAD = {
      users: [],
      user_key: state.password,
    };

    if (!chatId?.includes("group") && nextPersonId) {
      payload.users = [nextPersonId];
    }

    if (chatId?.includes("group")) {
      payload.users = state.selectedMembers;
    }

    if (type === "keyring") {
      if (!state.selectedCategory || !state.selectedPasswordLabel) return;

      const cat_Id = keyringPasswords.find(
        (key) => key.keyring_category_name === state.selectedCategory,
      )?._id;

      payload["keyring_category_name"] = state.selectedCategory;
      payload["keyring_category_id"] = cat_Id;
      payload["keyring_password_key"] = state.selectedPasswordLabel;
    }

    setTrigger({
      toTrigger: TRIGGERS.privateMessageSender,
      payload: { ...payload },
    });
  };

  const fetchGroupMembers = () => {
    if (!chatId) return;
    if (!chatId.includes("group")) return;

    FetchMembersFn(async () => {
      try {
        const params = {
          target_user: target_user ? target_user : undefined,
          group_id: encodeURIComponent(chatId),
        };
        const response = await api.get(ENDPOINTS.GROUPS.GETMEMBERS, {
          params,
          signal: controller.signal,
        });

        if (response.status === 200) {
          let mems = response.data?.data?.members ?? [];
          const own_user_id = target_user ? target_user : userDetails?.username;

          if (!Array.isArray(mems)) return;

          mems = mems.filter((user) => user !== own_user_id);

          mems = mems.map((u: string) => {
            const savedMem = contactNameProvider(u);
            return {
              label: savedMem,
              value: u,
            };
          });

          setMembers(mems);
        }
      } catch (error) {
        Notification.error(getApiErrorMessage(error));
      }
    });
  };

  const initialActions = () => {
    fetchKeyRing();
    fetchGroupMembers();
  };

  useEffect(() => {
    if (trigger === TRIGGERS.privateMessageModal) {
      initialActions();
    }

    return () => {
      controller.abort();
      dispatch({ type: "RESET" });
    };
  }, [trigger]);

  return (
    <Modal
      opened={trigger === TRIGGERS.privateMessageModal}
      onClose={onClose}
      withCloseButton={false}
      centered
      radius={"lg"}
    >
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
                dispatch({ type: "SET_PASSWORD", payload: e.target.value })
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
                  <Text size="xs" fw={500} mb={1} className="text-red-500">
                    Incorrect otp
                  </Text>
                )}
              </div>
            )}
          </>
        )}

        {chatId?.includes("group") && (
          <MultiSelect
            label="Group members"
            placeholder="Select members"
            size="xs"
            mt={"sm"}
            searchable
            clearable
            loading={fetchMembersLoader}
            readOnly={fetchMembersLoader}
            data={members}
            value={state.selectedMembers}
            onChange={(e) => {
              console.log(e);
              dispatch({ type: "SET_SELECTED_MEMBERS", payload: e });
            }}
          />
        )}

        <Flex mt={"md"} justify={"center"}>
          {state.tab === "MANUAL PASSWORD" ? (
            <Button
              onClick={() => handleSubmit("manualPassword")}
              size="xs"
              disabled={state.password.trim().length < 5}
            >
              Submit
            </Button>
          ) : (
            <Button
              size="xs"
              onClick={() => handleSubmit("keyring")}
              disabled={!state.selectedCategory || !state.selectedPasswordLabel}
            >
              Submit
            </Button>
          )}
        </Flex>
      </div>
    </Modal>
  );
}

export default PrivateMessagePayloadModal;
