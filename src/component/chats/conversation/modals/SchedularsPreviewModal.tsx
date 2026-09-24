import { Modal, Table } from "@mantine/core";
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
import { Notification } from "../../../../utils/notification";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { useTranslation } from "../../../../store/language/language.store";

function SchedularsPreviewModal() {
  const { openers, popOpener } = useOpenerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { storeScheduleMsgs, messages } = useScheduleMsgsStore(
    (state) => state,
  );
  const { translation } = useTranslation();

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
      Notification.error(getApiErrorMessage(error));
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
      size={"xl"}
    >
      <Table withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              {translation("chat_history.modal-schedule-th-msg", "Message")}
            </Table.Th>
            <Table.Th>
              {translation("chat_history.modal-schedule-th-media", "Media")}
            </Table.Th>
            <Table.Th>
              {translation("chat_history.modal-schedule-th-action", "Action")}
            </Table.Th>
            <Table.Th>
              {translation(
                "chat_history.modal-schedule-th-frequency",
                "Frequency",
              )}
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fetchLoader ? (
            <Table.Tr>
              <Table.Td colSpan={4} className=" text-center">
                {translation(
                  "chat_history.modal-schedule-th-loader",
                  "Fetching scheduled messages. Please wait...",
                )}
              </Table.Td>
            </Table.Tr>
          ) : (
            <>
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <ScheduledMsgCard key={msg._id} msg={msg} />
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4} className="text-red-500 text-center">
                    {translation(
                      "chat_history.modal-schedule-th-empty",
                      "No scheduled messages found",
                    )}
                  </Table.Td>
                </Table.Tr>
              )}
            </>
          )}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}

export default SchedularsPreviewModal;
