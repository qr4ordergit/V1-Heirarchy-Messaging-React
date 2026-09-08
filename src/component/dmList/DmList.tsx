import { useEffect, useState } from "react";
import { DmService } from "../../api/services/dm.service";
import { useDMListStore } from "../../store/dm/dm.list.store";
import { Notification } from "../../utils/notification";
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import ConversationItem from "../conversationItem/ConversationItem";
import { IconRefresh } from "@tabler/icons-react";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import axios from "axios";
import { useTranslation } from "../../store/language/language.store";

interface SelectedDMState {
  chatID: string;
  display_name: string;
}

const DmList = () => {
  const dms = useDMListStore((state) => state.dms);
  const setDMs = useDMListStore((state) => state.setDMs);
  const reset = useDMListStore((state) => state.reset);
  const search = useConversationTypeStore((state) => state.search);

  const { translation } = useTranslation();

  const filteredDMs = dms.filter((dm) =>
    dm.display_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const [loading, setLoading] = useState<boolean>(false);

  const [selectedDM, setSelectedDM] = useState<SelectedDMState>({
    chatID: "",
    display_name: "",
  });

  const resetSelectedDM = () => {
    setSelectedDM({ chatID: "", display_name: "" });
  };

  const [deleteOpened, setDeleteOpened] = useState(false);

  const handleDeleteClick = (id: string, display_name: string) => {
    setSelectedDM((prev) => ({
      ...prev,
      chatID: id,
      display_name: display_name,
    }));
    setDeleteOpened(true);
  };

  const loadDMs = async () => {
    try {
      setLoading(true);
      const dms = await DmService.getDMs({
        limit: 50,
      });

      setDMs(dms.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
      reset();
    } finally {
      setLoading(false);
    }
  };

  const deleteDm = async (action: number) => {
    try {
      setLoading(true);
      const res = await DmService.deleteDM({
        chatID: selectedDM.chatID,
        action: action,
      });
      setDeleteOpened(false);
      resetSelectedDM();
      Notification.success(res.message);
      await loadDMs();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
      reset();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDMs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return !loading ? (
    filteredDMs.length > 0 ? (
      <>
        <Stack gap={4} pb={50}>
          {filteredDMs.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              onDelete={() =>
                handleDeleteClick(conversation._id, conversation.display_name)
              }
            />
          ))}
        </Stack>
        <ActionIcon
          pos="absolute"
          bottom={10}
          right={10}
          size={30}
          onClick={loadDMs}
        >
          <IconRefresh size={15} />
        </ActionIcon>
        <Modal
          opened={deleteOpened}
          onClose={() => {
            setDeleteOpened(false);
            resetSelectedDM();
          }}
          title={translation(
            "chat_page.label_delete_con",
            "Delete conversation",
          )}
          centered
        >
          <Text size="xs">
            {translation(
              "chat_page.alert_delete_con",
              "Are you sure you want to delete your conversation with",
            )}{" "}
            <b>{selectedDM?.display_name}</b>?
          </Text>

          <Group justify="flex-end" mt="lg">
            <Button
              color="red"
              size="compact-xs"
              loading={loading}
              onClick={() => {
                deleteDm(0);
              }}
            >
              {translation("chat_page.btn_temp_del", "Temporary Delete")}
            </Button>
            <Button
              color="red"
              size="compact-xs"
              loading={loading}
              onClick={() => {
                deleteDm(1);
              }}
            >
              {translation("chat_page.btn_per_del", "Permanent Delete")}
            </Button>
          </Group>
        </Modal>
      </>
    ) : (
      <Center>
        <Text c="red.6" size="xs">
          {translation(
            "chat_page.label_dm_not_found",
            "No direct messages found",
          )}
        </Text>
      </Center>
    )
  ) : (
    <Center>
      <Loader size={20} />
    </Center>
  );
};
export default DmList;
