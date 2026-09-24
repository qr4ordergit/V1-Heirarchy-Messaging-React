import { Button, Divider, Flex, Group, Paper } from "@mantine/core";
import {
  useScheduleMsgsStore,
  type SCHEDULED_MESSAGE,
} from "../../../../store/schedules/schedules.store";
import { IconClockHour10 } from "@tabler/icons-react";
import { useOpenerStore } from "../../../../store/openers/opener.store";
import { OPENERS } from "../../../../utils/constant";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useTransition } from "react";
import { MediaChat } from "../MediaChat";

interface MSG {
  msg: SCHEDULED_MESSAGE;
}

function ScheduledMsgCard({ msg }: MSG) {
  const { insertOpener } = useOpenerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { deleteScheduleMsg } = useScheduleMsgsStore((state) => state);

  const [deleteLoader, DeleteFn] = useTransition();

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
      console.log(error);
    }
  };

  const handleDelete = () => {
    DeleteFn(onDelete);
  };

  return (
    <Paper
      shadow="xs"
      radius="lg"
      p="md"
      maw="70%"
      bg={"blue.6"}
      className="relative text-white w-fit"
    >
      {msg?.media_url ? (
        <Flex gap={6} justify={"center"} wrap={"wrap"}>
          {msg?.media_url?.map((url, i) => (
            <MediaChat key={i} url={url} msg={msg} />
          ))}
        </Flex>
      ) : (
        ""
      )}
      <div>{msg.text}</div>
      <Divider my={"md"} />
      <Group>
        <Button
          variant="outline"
          color="white"
          size="compact-sm"
          onClick={onEdit}
        >
          Edit Scheduled Message
        </Button>
        <Button
          variant="outline"
          color="white"
          size="compact-sm"
          onClick={handleDelete}
          loading={deleteLoader}
          loaderProps={{ type: "dots" }}
        >
          Delete
        </Button>
      </Group>
      <Flex
        gap={4}
        justify={"end"}
        align={"center"}
        className="text-gray-200 text-[12px] mt-2"
      >
        <IconClockHour10 size={12} />
        <div>{msg.schedule_date}</div>
        <div>{msg.schedule_time}</div>
      </Flex>
    </Paper>
  );
}

export default ScheduledMsgCard;
