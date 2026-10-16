import {
  Button,
  Center,
  Chip,
  Divider,
  Flex,
  Group,
  Input,
  Loader,
  Modal,
  PinInput,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { KeyringCategories } from "../../api/services/keyring.categories.service";
import axios from "axios";
import { Notification } from "../../utils/notification";
import { useTranslation } from "../../store/language/language.store";
import {
  DmGroupLockService,
  type LockPayload,
} from "../../api/services/dm.group.lock.service";

export interface LockDmAndGroupModalDataState {
  open: boolean;
  for: string;
  chat_id: string;
  dmOrGroupName: string;
}

interface Props {
  data: LockDmAndGroupModalDataState;
  onClose: (reload: boolean) => void;
}

interface LoadingState {
  list: boolean;
  update: boolean;
  otp: boolean;
}

interface Options {
  value: string;
  label: string;
  "2fa": boolean;
  passwords: Record<string, string>;
}

interface keyringCategoriesDataState {
  categories: Options[];
  keyring_category_id: Options | null;
  keyring_password_key: string;
  user_key: string;
}

interface KeyringCategoriesOptions {
  _id: string;
  keyring_category_name: string;
  keyring_category_passwords: Record<string, string>;
  "2fa": boolean;
}

const LockDmAndGroupModal = ({ data, onClose }: Props) => {
  const { translation } = useTranslation();

  const [loading, setLoading] = useState<LoadingState>({
    list: false,
    update: false,
    otp: false,
  });

  const handleSetLoading = (type: string, status: boolean) => {
    setLoading((prev) => ({ ...prev, [type]: status }));
  };

  const [keyringCategoriesData, setKeyringCategoriesData] =
    useState<keyringCategoriesDataState>({
      categories: [],
      keyring_category_id: null,
      keyring_password_key: "",
      user_key: "",
    });

  const loadKeyringCategories = async () => {
    try {
      handleSetLoading("list", true);
      const res = await KeyringCategories.get();
      if (res.data.length > 0) {
        setKeyringCategoriesData((prev) => ({
          ...prev,
          categories: res.data.map((i: KeyringCategoriesOptions) => ({
            label: i.keyring_category_name,
            value: i._id,
            passwords: i.keyring_category_passwords
              ? i.keyring_category_passwords
              : {},
            "2fa": i["2fa"],
          })),
        }));
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      handleSetLoading("list", false);
    }
  };

  const handleSubmit = async () => {
    try {
      handleSetLoading("update", true);
      let payload = {
        for: data.for,
        chat_id: data.chat_id,
      } as LockPayload;

      if (keyringCategoriesData.user_key === "") {
        payload = {
          ...payload,
          keyring_category_id: keyringCategoriesData.keyring_category_id?.value,
          keyring_password_key: keyringCategoriesData.keyring_password_key,
        };
      } else {
        payload = {
          ...payload,
          user_key: keyringCategoriesData.user_key,
        };
      }
      await DmGroupLockService.lock(payload);
      onClose(true);
      Notification.success(
        data.for === "DM"
          ? translation(
              "chat_page.success_msg_lock_conversation",
              "Conversation locked successfully",
            )
          : translation(
              "chat_page.success_msg_lock_group",
              "Group locked successfully",
            ),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      handleSetLoading("update", false);
    }
  };

  const handleChangeOtp = async (otp: string) => {
    if (otp.length === 6) {
      const res = await KeyringCategories.otp(
        keyringCategoriesData.keyring_category_id
          ? keyringCategoriesData.keyring_category_id.value
          : "",
        otp,
      );
      if (res.is_valid_otp) {
       setKeyringCategoriesData((prev) => ({
  ...prev,
  keyring_category_id: prev.keyring_category_id
    ? {
        ...prev.keyring_category_id,
        "2fa": false,
        passwords: res.data.keyring_category_passwords,
      }
    : null,
}));
      } else {
        Notification.error(
          translation(
            "chat_page.err_msg_invalid_otp",
            "Please enter valid otp!",
          ),
        );
      }
      try {
        handleSetLoading("otp", true);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          Notification.error(
            error.response?.data?.message || error.message,
            error.response?.data?.error,
          );
        } else if (error instanceof Error) {
          Notification.error(error.message);
        }
      } finally {
        handleSetLoading("otp", false);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadKeyringCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      opened={data.open}
      onClose={() => onClose(false)}
      title={
        <Text size="sm">
          {data.for === "DM"
            ? translation(
                "chat_page.label_lock_conversation",
                "Lock conversation",
              )
            : translation("chat_page.label_lock_group", "Lock group")}{" "}
          <b>{data.dmOrGroupName}</b>
        </Text>
      }
      centered
    >
      <Stack gap={"xs"}>
        <Select
          size="xs"
          data={keyringCategoriesData.categories}
          placeholder={translation(
            "chat_page.label_select_keyring_category",
            "Select Keyring Category",
          )}
          value={
            keyringCategoriesData.keyring_category_id
              ? keyringCategoriesData.keyring_category_id.value
              : null
          }
          onChange={(value) =>
            setKeyringCategoriesData((prev) => ({
              ...prev,
              keyring_category_id:
                prev.categories.find((item) => item.value === value) ?? null,
              keyring_password_key: "",
              user_key: "",
            }))
          }
          loading={loading.list}
          disabled={loading.list}
        />
        {keyringCategoriesData.keyring_category_id &&
        Object.keys(keyringCategoriesData.keyring_category_id.passwords)
          .length !== 0 ? (
          <Chip.Group
            multiple={false}
            value={keyringCategoriesData.keyring_password_key}
            onChange={(value) =>
              setKeyringCategoriesData((prev) => ({
                ...prev,
                keyring_password_key: value,
              }))
            }
          >
            <Text size="xs">
              {translation(
                "chat_page.label_select_password",
                "Select Password",
              )}
            </Text>
            <Group gap={2}>
              {Object.entries(
                keyringCategoriesData.keyring_category_id.passwords,
              ).map(([key, value]) => (
                <Chip key={key + value} value={key} size="xs" variant="light">
                  {key}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        ) : null}
        {keyringCategoriesData.keyring_category_id &&
          keyringCategoriesData.keyring_category_id["2fa"] && (
            <>
              <Text size="xs">
                {translation(
                  "chat_page.msgEnter2FAOtp",
                  "This category is protected with Two-Factor Authentication. Please enter your verification code to proceed.",
                )}
              </Text>
              <Center>
                {loading.otp ? (
                  <Loader size={"xs"} />
                ) : (
                  <PinInput
                    size="xs"
                    length={6}
                    type={"number"}
                    onChange={(v) => handleChangeOtp(v)}
                    disabled={loading.otp}
                  />
                )}
              </Center>
            </>
          )}
        <Divider label="OR" labelPosition="center" />
        <Input
          placeholder={translation(
            "chat_page.label_enter_manual_password",
            "Enter Manual Password",
          )}
          size="xs"
          value={keyringCategoriesData.user_key}
          onChange={(e) =>
            setKeyringCategoriesData((prev) => ({
              ...prev,
              user_key: e.target.value,
              keyring_category_id: null,
              keyring_password_key: "",
            }))
          }
        />
        {(keyringCategoriesData.keyring_password_key !== "" ||
          keyringCategoriesData.user_key !== "") && (
          <Flex justify={"end"}>
            <Button
              size="compact-xs"
              variant="outline"
              onClick={handleSubmit}
              loading={loading.update}
            >
              {translation("chat_page.label_btn_submit", "Submit")}
            </Button>
          </Flex>
        )}
      </Stack>
    </Modal>
  );
};

export default LockDmAndGroupModal;
