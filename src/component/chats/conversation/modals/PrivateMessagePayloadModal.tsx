import {
  Button,
  Fieldset,
  Group,
  Modal,
  MultiSelect,
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
  const { userDetails, targetUserDetails } = useAuthStore((state) => state);

  const [members, setMembers] = useState<string[]>([]);
  const [password, setPassword] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [fetchLoader, FetchFn] = useTransition();

  const onClose = () => {
    resetTrigger();
  };

  const fetchGroupMembers = async () => {
    if (!chatId) return;

    try {
      const target_user = targetUserDetails?.user_id
        ? `&target_user=${targetUserDetails?.user_id}`
        : "";
      const response = await api.get<MembersResponse>(
        `${ENDPOINTS.GROUPS.GETMEMBERS}?group_id=${encodeURIComponent(chatId)}${target_user}`,
      );

      if (response.status === 200) {
        let mems = response.data?.data?.[0]?.members ?? [];
        const own_user_id = targetUserDetails?.user_id ?? userDetails?.username;

        mems = mems.filter((user) => user !== own_user_id);
        setMembers(mems);
      }
    } catch {}
  };

  const onSubmit = async () => {
    try {
      if (password.trim().length === 0) {
        Notification.error("Password is mandatory");
        return;
      }

      setTrigger({
        toTrigger: TRIGGERS.privateMessageSender,
        payload: {
          password: password,
          users: selectedMembers,
        },
      });
      setPassword("");
      setSelectedMembers([]);
    } catch (error) {
      console.log(error);
      Notification.error("Failed to add password");
    }
  };

  useEffect(() => {
    if (trigger === TRIGGERS.privateMessageModal) {
      FetchFn(fetchGroupMembers);
    }
  }, [trigger]);

  return (
    <Modal
      opened={trigger === TRIGGERS.privateMessageModal}
      onClose={onClose}
      title="Enter password to make message & select group members if you want to mention"
    >
      <Fieldset legend="Private message information">
        <TextInput
          label="Private password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <MultiSelect
          label="Select group members"
          placeholder="Select"
          data={members}
          clearable
          loading={fetchLoader}
          value={selectedMembers}
          onChange={setSelectedMembers}
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={onSubmit}>Submit</Button>
        </Group>
      </Fieldset>
    </Modal>
  );
}

export default PrivateMessagePayloadModal;
