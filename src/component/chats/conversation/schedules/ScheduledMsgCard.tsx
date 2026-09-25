import { Flex, Loader, Menu, Paper, Text } from "@mantine/core";
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
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { Notification } from "../../../../utils/notification";
import {
  IconClockHour10,
  IconDotsVertical,
  IconEdit,
  IconPaperclip,
  IconTrash,
} from "@tabler/icons-react";
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
    <Paper withBorder py={6} px={10}>
      <Flex justify={"space-between"}>
        <Text className="text-gray-600" size="xs">
          {translation("chat_history.modal-schedule-title-msg", "Message")}
        </Text>
        <Flex gap={4}>
          {msg.media_url.length > 0 ? <IconPaperclip size={16} /> : ""}
          {deleteLoader ? (
            <Loader size={"xs"} color="dark" />
          ) : (
            <Menu>
              <Menu.Target>
                <IconDotsVertical size={16} className="cursor-pointer" />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  onClick={onEdit}
                  leftSection={<IconEdit size={16} />}
                >
                  {translation("chat_history.modal-schedule-action1", "Edit")}
                </Menu.Item>
                <Menu.Item
                  onClick={handleDelete}
                  leftSection={<IconTrash size={16} />}
                  color="red"
                >
                  {translation("chat_history.modal-schedule-action2", "Delete")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Flex>
      </Flex>
      <Text>{msg.text}</Text>
      <Flex justify={"end"} align={"center"} gap={4}>
        <IconClockHour10 size={14} color="gray" />
        <Text
          size="sm"
          className="text-gray-600"
        >{`Repeat : ${msg.repeat} |`}</Text>
        <Text size="sm">{`${msg.schedule_date ?? ""} ${msg.schedule_time}`}</Text>
      </Flex>
    </Paper>
  );
}

export default ScheduledMsgCard;
