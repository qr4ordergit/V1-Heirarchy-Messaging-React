import {
  Button,
  Flex,
  Modal,
  MultiSelect,
  Stack,
  Textarea,
} from "@mantine/core";
import { useOpenerStore } from "../../../../store/openers/opener.store";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { OPENERS } from "../../../../utils/constant";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { Notification } from "../../../../utils/notification";
import { useScheduleMsgsStore } from "../../../../store/schedules/schedules.store";
import { DateTimePicker, TimePicker } from "@mantine/dates";
import dayjs from "dayjs";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";

function EditScheduleMsgModal() {
  const { openers, popOpener } = useOpenerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { updateScheduleMsg } = useScheduleMsgsStore((state) => state);

  const trigger = openers[OPENERS.editScheduledMsg]?.opener;

  const [message, setMessage] = useState<string>("");
  const [dateTime, setDateTime] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [days, setDays] = useState<string[]>([]);

  const [submitLoader, SubmitFn] = useTransition();

  const onClose = () => {
    popOpener({
      opener: OPENERS.editScheduledMsg,
    });
  };

  const scheduledMessage = useMemo(
    () => openers[OPENERS.editScheduledMsg]?.payload,
    [openers],
  );
  const presets = [
    {
      value: dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm:ss"),
      label: "Yesterday",
    },
    {
      value: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      label: "Today",
    },
    {
      value: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
      label: "Tomorrow",
    },
    {
      value: dayjs().add(1, "month").format("YYYY-MM-DD HH:mm:ss"),
      label: "Next month",
    },
    {
      value: dayjs().add(1, "year").format("YYYY-MM-DD HH:mm:ss"),
      label: "Next year",
    },
    {
      value: dayjs().subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"),
      label: "Last month",
    },
    {
      value: dayjs().subtract(1, "year").format("YYYY-MM-DD HH:mm:ss"),
      label: "Last year",
    },
  ];
  const daysList = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const dataAssigner = () => {
    if (trigger !== OPENERS.editScheduledMsg) return;

    const payload = openers[OPENERS.editScheduledMsg]?.payload;
    const text = payload?.text;

    if (typeof text !== "string") return;

    setMessage(text);
  };

  const onSubmit = async () => {
    const id = scheduledMessage?._id;
    const repeat = scheduledMessage?.repeat;

    if (typeof repeat !== "string") return;
    if (typeof id !== "string") return;

    const payload = {
      schedule_id: scheduledMessage?._id,
      text: message,
      schedule_date: scheduledMessage?.schedule_date,
      schedule_time: scheduledMessage?.schedule_time,
      repeat: scheduledMessage?.repeat,
      days: scheduledMessage?.days,
      day: scheduledMessage?.day,
      status: scheduledMessage?.status,
    };

    if (repeat === "none" && dateTime) {
      payload["schedule_date"] = dateTime?.split(" ")[0];
      payload["schedule_time"] = dateTime
        ?.split(" ")
        .reverse()[0]
        .split(":")
        .slice(0, 2)
        .join(":");
    }

    if (repeat === "daily" && time) {
      payload.schedule_time = time;
    }

    if (repeat === "weekly") {
      if (time) {
        payload.schedule_time = time;
      }
      if (days.length > 0) {
        payload.days = days;
      }
    }

    if (repeat === "monthly" && dateTime) {
      payload.schedule_date = dateTime?.split(" ")[0];
      payload.schedule_time = dateTime
        ?.split(" ")
        .reverse()[0]
        .split(":")
        .slice(0, 2)
        .join(":");
    }

    const params = {
      target_user: target_user ? target_user : undefined,
    };

    try {
      const res = await api.put(ENDPOINTS.MESSAGES.SCHEDULED_PUT, payload, {
        params,
      });

      if (!res.data?.success) return;

      Notification.success("Scheduled message updated.");
      updateScheduleMsg(res.data?.data);
      setDateTime("");
      setDays([]);
      setMessage("");
      setTime("");
      onClose();
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const handleSubmit = () => {
    SubmitFn(onSubmit);
  };

  const conditionalRenderer = {
    schedule: useCallback(() => {
      switch (scheduledMessage?.repeat) {
        case "none":
          return (
            <DateTimePicker
              label="Update date and time"
              placeholder="Pick date and time"
              presets={presets}
              timePickerProps={{
                withDropdown: true,
                popoverProps: { withinPortal: false },
                format: "12h",
              }}
              clearable
              value={dateTime}
              onChange={(e) => setDateTime(String(e))}
            />
          );
        case "daily":
          return (
            <TimePicker
              label="Update time"
              withDropdown
              format="12h"
              clearable
              value={time}
              onChange={setTime}
            />
          );
        case "weekly":
          return (
            <>
              <TimePicker
                label="Update time"
                withDropdown
                format="12h"
                clearable
                value={time}
                onChange={setTime}
              />
              <MultiSelect
                label="Update days"
                placeholder="select days"
                clearable
                data={daysList}
                value={days}
                onChange={setDays}
              />
            </>
          );
        case "monthly":
          return (
            <DateTimePicker
              label="Update date and time"
              placeholder="Pick date and time"
              timePickerProps={{
                withDropdown: true,
                popoverProps: { withinPortal: false },
                format: "12h",
              }}
              clearable
              value={dateTime}
              onChange={(e) => setDateTime(String(e))}
            />
          );
      }
    }, [scheduledMessage, days, dateTime, time]),
  };

  useEffect(() => {
    dataAssigner();
  }, [openers]);

  return (
    <Modal
      opened={trigger === OPENERS.editScheduledMsg}
      onClose={onClose}
      title={"Edit message"}
    >
      <Stack>
        <Textarea
          placeholder="Enter message"
          className="w-100"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          readOnly={submitLoader}
        />
        <Flex gap={4} align={"center"} className="text-[12px] mt-2">
          <div className="font-bold">Scheduled : </div>
          <div>
            {typeof scheduledMessage?.schedule_date === "string"
              ? scheduledMessage?.schedule_date
              : ""}
          </div>
          <div>
            {typeof scheduledMessage?.schedule_time === "string"
              ? scheduledMessage?.schedule_time
              : ""}
          </div>
          {Array.isArray(scheduledMessage?.days)
            ? scheduledMessage?.days?.map((day) => <div key={day}>{day}</div>)
            : ""}
        </Flex>
        {conditionalRenderer.schedule()}
        <Button
          onClick={handleSubmit}
          loading={submitLoader}
          loaderProps={{ type: "dots" }}
        >
          Update
        </Button>
      </Stack>
    </Modal>
  );
}

export default EditScheduleMsgModal;
