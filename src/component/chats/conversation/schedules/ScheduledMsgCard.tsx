import { Button, Flex, Group, Table } from "@mantine/core";
import {
  useScheduleMsgsStore,
  type SCHEDULED_MESSAGE,
} from "../../../../store/schedules/schedules.store";
import { useOpenerStore } from "../../../../store/openers/opener.store";
import { OPENERS } from "../../../../utils/constant";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useTransition } from "react";
import { MediaChat } from "../MediaChat";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { Notification } from "../../../../utils/notification";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "../../../../store/language/language.store";

interface MSG {
  msg: SCHEDULED_MESSAGE;
}

function ScheduledMsgCard({ msg }: MSG) {
  const { insertOpener } = useOpenerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { deleteScheduleMsg } = useScheduleMsgsStore((state) => state);

  const [deleteLoader, DeleteFn] = useTransition();

  const { translation } = useTranslation();

  const onEdit = () => {
    insertOpener({
      opener: OPENERS.editScheduledMsg,
      payload: msg,
    });
  };

  const onDelete = async () => {
    const params = {
      target_user: target_user ? target_user : undefined,
      schedule_id: msg._id,
    };

    try {
      const res = await api.delete(ENDPOINTS.MESSAGES.SCHEDULED_DELETE, {
        params,
      });

      if (res.data?.success) {
        deleteScheduleMsg(msg._id);
      }
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = () => {
    DeleteFn(onDelete);
  };

  return (
    <Table.Tr>
      <Table.Td>{msg.text}</Table.Td>
      <Table.Td className="overflow-auto text-center">
        {msg?.media_url?.length > 0 ? (
          <Flex gap={6} justify={"center"}>
            {msg?.media_url?.map((url, i) => (
              <MediaChat key={i} url={url} msg={msg} />
            ))}
          </Flex>
        ) : (
          "-"
        )}
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Button
            variant="outline"
            size="compact-sm"
            onClick={onEdit}
            leftSection={<IconEdit size={16} />}
          >
            {translation("chat_history.modal-schedule-td-action1", "Edit")}
          </Button>
          <Button
            variant="outline"
            size="compact-sm"
            onClick={handleDelete}
            loading={deleteLoader}
            loaderProps={{ type: "dots" }}
            leftSection={<IconTrash size={16} />}
          >
            {translation("chat_history.modal-schedule-td-action2", "Delete")}
          </Button>
        </Group>
      </Table.Td>
      <Table.Td>{msg.repeat}</Table.Td>
    </Table.Tr>
  );
}

export default ScheduledMsgCard;
