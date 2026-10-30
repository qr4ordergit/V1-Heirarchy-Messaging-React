import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
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
import LockDmAndGroupModal, {
  type LockDmAndGroupModalDataState,
} from "../modal/LockDmAndGroupModal";
import {
  DmGroupLockService,
  type UnlockPayload,
} from "../../api/services/dm.group.lock.service";

interface SelectedDMState {
  chatID: string;
  display_name: string;
}
interface DmListProps {
  viewportRef: RefObject<HTMLDivElement | null>;
}

interface DMCursor {
  _id: string;
  last_message: string;
}

const PAGE_SIZE = 10;

const DmList = ({ viewportRef }: DmListProps) => {
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

  const [deleteOpened, setDeleteOpened] = useState(false);

  const [lockDmAndGroupModalData, setLockDmAndGroupModalData] =
    useState<LockDmAndGroupModalDataState>({
      open: false,
      for: "",
      chat_id: "",
      dmOrGroupName: "",
    });

  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const cursorRef = useRef<DMCursor | null>(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const resetSelectedDM = () => {
    setSelectedDM({ chatID: "", display_name: "" });
  };

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

      cursorRef.current = null;
      hasMoreRef.current = true;

      const res = await DmService.getDMs({
        limit: PAGE_SIZE,
      });

      setDMs(res.data);

      cursorRef.current = res.next_cursor;

      hasMoreRef.current = res.data.length === PAGE_SIZE;
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

  const onCloseLockDmAndGroupModal = async (reload: boolean) => {
    setLockDmAndGroupModalData({
      open: false,
      for: "",
      chat_id: "",
      dmOrGroupName: "",
    });
    if (reload) await loadDMs();
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

  const unLockDm = async ({ for: target, chat_id }: UnlockPayload) => {
    try {
      setLoading(true);
      await DmGroupLockService.unlock({
        for: target,
        chat_id: chat_id,
      });
      Notification.success(
        translation(
          "chat_page.success_msg_unlock_conversation",
          "Conversation unlocked successfully",
        ),
      );
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
    } finally {
      setLoading(false);
    }
  };

  const loadMoreDMs = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || !cursorRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const res = await DmService.getDMs({
        limit: PAGE_SIZE,
        cursor: cursorRef.current,
      });

      const newDMs = res.data;

      if (newDMs.length > 0) {
        setDMs([...useDMListStore.getState().dms, ...newDMs]);
      }
      cursorRef.current = res.next_cursor;

      if (newDMs.length < PAGE_SIZE) {
        hasMoreRef.current = false;
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
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [setDMs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDMs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const rootElement = viewportRef.current;
    const targetElement = bottomRef.current;

    if (!rootElement || !targetElement || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreDMs();
        }
      },
      {
        root: rootElement,
        threshold: 0.1,
      },
    );

    observer.observe(targetElement);

    return () => observer.disconnect();
  }, [loadMoreDMs, viewportRef, loading]);

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
              onSetLockDmAndGroupModalData={() =>
                setLockDmAndGroupModalData({
                  open: true,
                  for: "DM",
                  chat_id: conversation._id,
                  dmOrGroupName: conversation.display_name,
                })
              }
              unLock={() =>
                unLockDm({
                  for: "DM",
                  chat_id: conversation._id,
                })
              }
            />
          ))}
          <div ref={bottomRef} style={{ height: 10 }} />

          {loadingMore && (
            <Center py="xs">
              <Loader size={18} />
            </Center>
          )}
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
        {lockDmAndGroupModalData.open && (
          <LockDmAndGroupModal
            data={lockDmAndGroupModalData}
            onClose={onCloseLockDmAndGroupModal}
          />
        )}
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
