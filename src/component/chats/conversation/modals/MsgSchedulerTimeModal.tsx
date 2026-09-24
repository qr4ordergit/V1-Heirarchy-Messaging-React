import { Button, Modal, MultiSelect, Stack, Tabs } from "@mantine/core";
import { TRIGGERS } from "../../../../utils/constant";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { DateTimePicker, TimePicker } from "@mantine/dates";
import { useState } from "react";
import dayjs from "dayjs";

interface PAYLOAD {
  schedule_time?: string;
  schedule_date?: string;
  repeat?: string | null;
  days?: string[];
}

function MsgSchedulerTimeModal() {
  const { trigger, resetTrigger, setTrigger } = useTriggerStore(
    (state) => state,
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

  const [activeTab, setActiveTab] = useState<string | null>("no_repeat");
  const [dateTime, setDateTime] = useState<string | null>(null);
  const [time, setTime] = useState<string>("");
  const [days, setDays] = useState<string[]>([]);

  const onClose = () => {
    resetTrigger();
  };

  const onSubmit = () => {
    const payload: PAYLOAD = {};

    if (activeTab === "no_repeat") {
      payload.repeat = "none";
      payload.schedule_date = dateTime?.split(" ")[0];
      payload.schedule_time = dateTime
        ?.split(" ")
        .reverse()[0]
        .split(":")
        .slice(0, 2)
        .join(":");
    }

    if (activeTab === "daily") {
      payload.repeat = "daily";
      payload.schedule_time = time;
    }

    if (activeTab === "weekly") {
      payload.repeat = "weekly";
      payload.schedule_time = time;
      payload.days = days;
    }

    if (activeTab === "monthly") {
      payload.repeat = "monthly";
      payload.schedule_date = dateTime?.split(" ")[0];
      payload.schedule_time = dateTime
        ?.split(" ")
        .reverse()[0]
        .split(":")
        .slice(0, 2)
        .join(":");
    }

    setTrigger({
      toTrigger: "schedulePayload",
      payload: {
        ...payload,
      },
    });
  };

  return (
    <Modal
      opened={trigger === TRIGGERS.schedulePayload}
      onClose={onClose}
      title={"Set time to schedule message"}
    >
      <Stack>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="no_repeat">No repeat</Tabs.Tab>
            <Tabs.Tab value="daily">Daily</Tabs.Tab>
            <Tabs.Tab value="weekly">Weekly</Tabs.Tab>
            <Tabs.Tab value="monthly">Monthly</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="no_repeat">
            <DateTimePicker
              label="Pick date and time"
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
          </Tabs.Panel>
          <Tabs.Panel value="daily">
            <TimePicker
              label="Select time"
              withDropdown
              format="12h"
              clearable
              value={time}
              onChange={setTime}
            />
          </Tabs.Panel>
          <Tabs.Panel value="weekly">
            <TimePicker
              label="Select time"
              withDropdown
              format="12h"
              clearable
              value={time}
              onChange={setTime}
            />
            <MultiSelect
              label="Select days"
              placeholder="select days"
              clearable
              data={daysList}
              value={days}
              onChange={setDays}
            />
          </Tabs.Panel>
          <Tabs.Panel value="monthly">
            <DateTimePicker
              label="Pick date and time"
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
          </Tabs.Panel>
        </Tabs>
        <Button onClick={onSubmit}>Set</Button>
      </Stack>
    </Modal>
  );
}

export default MsgSchedulerTimeModal;
