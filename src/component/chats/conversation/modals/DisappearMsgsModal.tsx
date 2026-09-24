import { Button, Group, Modal, NumberInput } from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { useParams } from "react-router";
import { TRIGGERS } from "../../../../utils/constant";
import { useEffect, useState, useTransition } from "react";
import { Notification } from "../../../../utils/notification";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useDMListStore } from "../../../../store/dm/dm.list.store";
import { useGroupListStore } from "../../../../store/groups/group.list.store";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";

interface TIMMER {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function DisappearMsgsModal() {
  const { trigger, resetTrigger } = useTriggerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const { dms, updateDmDisappearingMode } = useDMListStore((state) => state);
  const { groups, updateGroupDisappearingMode } = useGroupListStore(
    (state) => state,
  );

  const [timmer, setTimmer] = useState<TIMMER>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [submitLoader, SubmitFn] = useTransition();
  const [disableLoader, DisableFn] = useTransition();

  const onClose = () => {
    resetTrigger();
  };

  const onChange = (val: number, key: string) => {
    setTimmer((prev) => ({ ...prev, [key]: val }));
  };

  const dataProvider = () => {
    if (!chatId) return;

    if (chatId?.includes("group")) {
      const group = groups.find(
        (userDoc) => userDoc._id === decodeURIComponent(chatId),
      );

      if (!group?.disappearing_messages?.enabled) return;

      const totalSeconds = group?.disappearing_messages?.duration || 0;

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimmer({
        days,
        hours,
        minutes,
        seconds,
      });
    } else {
      const chat = dms.find(
        (userDoc) => userDoc._id === decodeURIComponent(chatId),
      );

      if (!chat?.disappearing_messages?.enabled) return;

      const totalSeconds = chat?.disappearing_messages?.duration || 0;

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimmer({
        days,
        hours,
        minutes,
        seconds,
      });
    }
  };

  const handleSet = async () => {
    if (!chatId) return;
    let seconds = timmer.seconds;

    seconds += timmer.minutes * 60;
    seconds += timmer.hours * 3600;
    seconds += timmer.days * 86400;

    if (seconds === 0) {
      Notification.error("Enter atleast seconds to set timmer");
      return;
    }

    if (seconds === 5) {
      Notification.error("Enter more than 5 seconds");
      return;
    }

    const payload = {
      _id: chatId,
      enabled: true,
      duration: seconds,
      message_type: chatId?.includes("group") ? "group" : "single",
    };

    const params = {
      target_user: target_user ? target_user : undefined,
    };

    try {
      const res = await api.post(ENDPOINTS.MESSAGES.DISAPPEAR, payload, {
        params,
      });

      if (res.data?.success) {
        Notification.success("Enabled disappering messages");
      }

      setTimmer({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });

      if (chatId?.includes("group")) {
        updateGroupDisappearingMode({
          _id: chatId,
          enabled: true,
          duration: seconds,
        });
      } else {
        updateDmDisappearingMode({
          _id: chatId,
          enabled: true,
          duration: seconds,
        });
      }

      onClose();
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const handleDisable = async () => {
    if (!chatId) return;
    const payload = {
      _id: chatId,
      enabled: false,
      message_type: chatId?.includes("group") ? "group" : "single",
    };

    const params = {
      target_user: target_user ? target_user : undefined,
    };

    try {
      const res = await api.post(ENDPOINTS.MESSAGES.DISAPPEAR, payload, {
        params,
      });

      if (res.data?.success) {
        Notification.success("Disabled disappering messages");
      }

      setTimmer({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });

      if (chatId?.includes("group")) {
        updateGroupDisappearingMode({
          _id: chatId,
          enabled: false,
        });
      } else {
        updateDmDisappearingMode({
          _id: chatId,
          enabled: false,
        });
      }

      onClose();
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const onSubmit = () => {
    SubmitFn(handleSet);
  };

  const onDisable = () => {
    DisableFn(handleDisable);
  };

  useEffect(() => {
    if (trigger === TRIGGERS.disappearChatModal) {
      dataProvider();
    }
  }, [trigger]);

  return (
    <Modal
      opened={trigger === TRIGGERS.disappearChatModal}
      onClose={onClose}
      title={"Set timmer for disappearing messages"}
    >
      <div className="flex gap-2">
        <NumberInput
          label="Days"
          min={0}
          max={365}
          value={timmer.days}
          onChange={(e) => onChange(Number(e), "days")}
        />
        <NumberInput
          label="Hours"
          min={0}
          max={24}
          value={timmer.hours}
          onChange={(e) => onChange(Number(e), "hours")}
        />
        <NumberInput
          label="Minutes"
          min={0}
          max={60}
          value={timmer.minutes}
          onChange={(e) => onChange(Number(e), "minutes")}
        />
        <NumberInput
          label="Seconds"
          min={0}
          max={60}
          withAsterisk
          value={timmer.seconds}
          onChange={(e) => onChange(Number(e), "seconds")}
        />
      </div>
      <Group justify="center" className="mt-2">
        <Button
          onClick={onSubmit}
          loading={submitLoader}
          loaderProps={{ type: "dots" }}
        >
          Set
        </Button>
        <Button
          onClick={onDisable}
          loading={disableLoader}
          loaderProps={{ type: "dots" }}
          variant="outline"
        >
          Disable
        </Button>
      </Group>
    </Modal>
  );
}

export default DisappearMsgsModal;
