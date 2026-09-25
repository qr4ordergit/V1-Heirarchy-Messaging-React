import {
  Button,
  Fieldset,
  Group,
  Modal,
  MultiSelect,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useParams } from "react-router";
import { useEffect, useState, useTransition } from "react";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { Notification } from "../../../../utils/notification";
import { useTranslation } from "../../../../store/language/language.store";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { getKeyringCategoriesApi } from "../../../../api/profileApi";
import type { KeyringCategoryItem } from "../../../../api/profileApi";

interface MembersResponse {
  data: [
    {
      members?: string[];
    },
  ];
}

function PrivateMessagePayloadModal() {
  const { trigger, resetTrigger, setTrigger } = useTriggerStore();
  const { chatId } = useParams<{ chatId: string }>();
  const { userDetails, targetUserDetails, target_user } = useAuthStore(
    (state) => state,
  );
  const { translation } = useTranslation();

  const [members, setMembers] = useState<string[]>([]);
  const [password, setPassword] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [keyringCategories, setKeyringCategories] = useState<
    KeyringCategoryItem[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedPasswordKey, setSelectedPasswordKey] = useState<string | null>(
    null,
  );
  const [loadingKeyrings, setLoadingKeyrings] = useState(false);

  const [fetchLoader, FetchFn] = useTransition();

  const resetForm = () => {
    setPassword("");
    setSelectedMembers([]);
    setSelectedCategoryId(null);
    setSelectedPasswordKey(null);
  };

  const onClose = () => {
    resetForm();
    resetTrigger();
  };

  const fetchKeyrings = async () => {
    setLoadingKeyrings(true);
    try {
      const data = await getKeyringCategoriesApi();
      setKeyringCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load keyring categories:", error);
    } finally {
      setLoadingKeyrings(false);
    }
  };

  const fetchGroupMembers = async () => {
    if (!chatId) return;

    if (!chatId.includes("group")) {
      const id = decodeURIComponent(chatId);
      const member = id.split("#").filter((u) => u !== userDetails?.username);
      setMembers(member);
      return;
    }

    try {
      const targetUserQuery =
        targetUserDetails?.user_id || target_user
          ? `&target_user=${targetUserDetails?.user_id || target_user}`
          : "";
      const response = await api.get<MembersResponse>(
        `${ENDPOINTS.GROUPS.GETMEMBERS}?group_id=${encodeURIComponent(chatId)}${targetUserQuery}`,
      );

      if (response.status === 200) {
        let mems = response.data?.data?.[0]?.members ?? [];
        const own_user_id =
          targetUserDetails?.user_id || target_user || userDetails?.username;

        mems = mems.filter((user) => user !== own_user_id);
        setMembers(mems);
      }
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const activeCategory = keyringCategories.find(
    (c) => (c.keyring_category_id || c._id) === selectedCategoryId,
  );

  const categorySelectData = keyringCategories.map((c) => ({
    value: c.keyring_category_id || c._id || "",
    label: c.keyring_category_name,
  }));

  const passwordKeySelectData = activeCategory?.keyring_category_passwords
    ? Object.keys(activeCategory.keyring_category_passwords).map((k) => ({
        value: k,
        label: k,
      }))
    : [];

  // When a category is picked or cleared
  const handleCategoryChange = (val: string | null) => {
    setSelectedCategoryId(val);
    setSelectedPasswordKey(null);

    // If category is cleared, clear password so user can manually type
    if (!val) {
      setPassword("");
    }
  };

  const handlePasswordKeyChange = (key: string | null) => {
    setSelectedPasswordKey(key);
    if (key && activeCategory?.keyring_category_passwords) {
      const resolvedPassword = activeCategory.keyring_category_passwords[key];
      setPassword(String(resolvedPassword ?? ""));
    } else {
      setPassword("");
    }
  };

  const onSubmit = async () => {
    try {
      if (password.trim().length === 0) {
        Notification.error(
          translation(
            "chat_history.alert-password-required",
            "Password is mandatory",
          ),
        );
        return;
      }

      setTrigger({
        toTrigger: TRIGGERS.privateMessageSender,
        payload: {
          password: password,
          users: selectedMembers,
          keyring_category_name:
            activeCategory?.keyring_category_name ?? undefined,
          keyring_password_key: selectedPasswordKey ?? undefined,
        },
      });

      resetForm();
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };
  useEffect(() => {
    if (trigger === TRIGGERS.privateMessageModal) {
      FetchFn(fetchGroupMembers);
      void fetchKeyrings();
    }
  }, [trigger]);

  const isManualPasswordDisabled = Boolean(selectedCategoryId);

  return (
    <Modal
      opened={trigger === TRIGGERS.privateMessageModal}
      onClose={onClose}
      title={translation(
        "chat_history.modal-e2e-title",
        "Enter password to make message & select group members if you want to mention",
      )}
      radius="md"
    >
      <Fieldset
        legend={translation(
          "chat_history.modal-e2e-legend",
          "Private message information",
        )}
      >
        <Stack gap="sm">
          <Select
            label={translation(
              "chat_history.selectKeyringCategory",
              "Keyring Category (Optional)",
            )}
            placeholder={
              loadingKeyrings
                ? translation("common.loading", "Loading...")
                : translation(
                    "chat_history.phSelectKeyringCat",
                    "Choose saved category",
                  )
            }
            data={categorySelectData}
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            clearable
            disabled={loadingKeyrings}
          />

          {selectedCategoryId && (
            <Select
              label={translation(
                "chat_history.selectPasswordKey",
                "Select Password",
              )}
              placeholder={translation(
                "chat_history.phSelectPasswordKey",
                "Choose password key",
              )}
              data={passwordKeySelectData}
              value={selectedPasswordKey}
              onChange={handlePasswordKeyChange}
              clearable
            />
          )}

          <TextInput
            label={translation(
              "chat_history.modal-e2e-label1",
              "Private password",
            )}
            placeholder={
              isManualPasswordDisabled
                ? translation(
                    "chat_history.phSelectedFromKeyring",
                    "Password populated from Keyring",
                  )
                : translation(
                    "chat_history.modal-e2e-ph1",
                    "Enter password manually",
                  )
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isManualPasswordDisabled}
          />

          {isManualPasswordDisabled && (
            <Text size="xs" c="dimmed">
              {translation(
                "chat_history.txtKeyringActiveNote",
                "Manual typing disabled while Keyring Category is selected. Clear category above to type manually.",
              )}
            </Text>
          )}

          <MultiSelect
            label={translation(
              "chat_history.modal-e2e-label2",
              "Select group members",
            )}
            placeholder={translation("chat_history.modal-e2e-ph2", "Select")}
            data={members}
            clearable
            loading={fetchLoader}
            value={selectedMembers}
            onChange={setSelectedMembers}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={onSubmit}>
              {translation("chat_history.modal-e2e-btn", "Submit")}
            </Button>
          </Group>
        </Stack>
      </Fieldset>
    </Modal>
  );
}

export default PrivateMessagePayloadModal;
