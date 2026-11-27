import { Flex, Loader, Menu, Paper, Text } from "@mantine/core";
import {
  useScheduleMsgsStore,
  type MEDIA_URL,
  type SCHEDULED_MESSAGE,
} from "../../../../store/schedules/schedules.store";
import { useOpenerStore } from "../../../../store/openers/opener.store";
import { OPENERS, TRIGGERS } from "../../../../utils/constant";
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import useSingleMediaDecryptor from "../../../../hooks/useSingleMediaDecryptor";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";

dayjs.extend(utc);

interface MSG {
  msg: SCHEDULED_MESSAGE;
}

function ScheduledMsgCard({ msg }: MSG) {
  const { insertOpener } = useOpenerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { deleteScheduleMsg } = useScheduleMsgsStore((state) => state);
  const { setTrigger } = useTriggerStore((state) => state);

  const [deleteLoader, DeleteFn] = useTransition();
  const [previewLoader, PreviewFn] = useTransition();

  const { translation } = useTranslation();
  const decryptor = useSingleMediaDecryptor();

  const onEdit = () => {
    insertOpener<SCHEDULED_MESSAGE>({
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

  const onPreview = (details: MEDIA_URL | File) => {
    if (details instanceof File) return;

    if (
      !["image", "video"].includes(details.media_details.type) &&
      !details.media_details.isEncrypted
    ) {
      window.open(details.media_url, "_blank", "noopener,noreferrer");
      return;
    }

    if (!details.media_details.isEncrypted) {
      setTrigger({
        toTrigger: TRIGGERS.previewMedia,
        payload: {
          src: details.media_url,
          type: details.media_details.type,
        },
      });
      return;
    }

    PreviewFn(async () => {
      const file = await decryptor(msg._id, details.media_url);

      if (!file) return;

      const url = URL.createObjectURL(file);

      if (!["image", "video"].includes(details.media_details.type)) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      setTrigger({
        toTrigger: TRIGGERS.previewMedia,
        payload: {
          src: url,
          type: details.media_details.type,
        },
      });
    });
  };

  return (
    <Paper withBorder py={10} px={10}>
      <Flex justify={"space-between"}>
        <Text className="text-gray-600" size="xs">
          {translation("chat_history.modal-schedule-title-msg", "Message")}
        </Text>
        <Flex gap={4}>
          {msg.media_url.length > 0 ? (
            <>
              {previewLoader ? (
                <Loader size={"xs"} color="dark" />
              ) : (
                <Menu position="left-start" width={200}>
                  <Menu.Target>
                    <IconPaperclip size={16} className="cursor-pointer" />
                  </Menu.Target>
                  <Menu.Dropdown>
                    {msg?.media_url?.map((med, i) => {
                      if (med instanceof File) return null;

                      return (
                        <Menu.Item
                          key={i}
                          onClick={() => onPreview(med)}
                          className="truncate"
                        >
                          <Text size="xs" textWrap="wrap">
                            {med.media_details.file_name}
                          </Text>
                        </Menu.Item>
                      );
                    })}
                  </Menu.Dropdown>
                </Menu>
              )}
            </>
          ) : (
            ""
          )}
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
        >{`${translation("chat_history.modal-schedule-freq-text", "Frequency")} : ${msg.repeat} |`}</Text>
        <Text size="sm">{`${msg.schedule_date ?? ""} ${msg?.schedule_time_12hr}`}</Text>
      </Flex>
    </Paper>
  );
}

export default ScheduledMsgCard;
