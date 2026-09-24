import { Modal, Stack, Text } from "@mantine/core";
import { useOpenerStore } from "../../../../store/openers/opener.store";
import { OPENERS } from "../../../../utils/constant";
import { api } from "../../../../api/axios";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useEffect, useTransition } from "react";
import { useParams } from "react-router";
import { useScheduleMsgsStore } from "../../../../store/schedules/schedules.store";
import ScheduledMsgCard from "../schedules/ScheduledMsgCard";
import useScheduleMediaDecryptor from "../../../../hooks/useScheduleMediaDecryptor";

function SchedularsPreviewModal() {
  const { openers, popOpener } = useOpenerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { storeScheduleMsgs, messages } = useScheduleMsgsStore(
    (state) => state,
  );

  const trigger = openers[OPENERS.schedulerList]?.opener;
  const decryptor = useScheduleMediaDecryptor();
  const [fetchLoader, FetchFn] = useTransition();

  const onClose = () => {
    popOpener({
      opener: OPENERS.schedulerList,
    });
  };

  const fetchScheduledMsgs = async () => {
    const params = {
      target_user: target_user ? target_user : undefined,
      chat_id: chatId,
    };

    try {
      const res = await api.get(ENDPOINTS.MESSAGES.SCHEDULED_GET, { params });

      if (!res.data?.success) return;
      const updatedMsgs = await decryptor(res.data?.data || []);
      storeScheduleMsgs(updatedMsgs);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (
      trigger === OPENERS.schedulerList &&
      Object.keys(openers).length === 1
    ) {
      FetchFn(fetchScheduledMsgs);
    }
  }, [openers]);

  return (
    <Modal
      opened={trigger === OPENERS.schedulerList}
      onClose={onClose}
      title={"Scheduled messages"}
      size={"lg"}
    >
      {fetchLoader ? (
        <Text>Fetching scheduled messages. Please wait...</Text>
      ) : (
        <Stack bg={"gray.2"} className="rounded p-2">
          {messages.length > 0 ? (
            messages.map((msg) => <ScheduledMsgCard key={msg._id} msg={msg} />)
          ) : (
            <Text className="text-red-500">No scheduled messages found</Text>
          )}
        </Stack>
      )}
    </Modal>
  );
}

export default SchedularsPreviewModal;
