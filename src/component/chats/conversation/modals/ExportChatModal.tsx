import { Button, Fieldset, Group, Loader, Modal } from "@mantine/core";
import { TRIGGERS } from "../../../../utils/constant";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { useParams } from "react-router";
import { Notification } from "../../../../utils/notification";

function ExportChatModal() {
  const { trigger, resetTrigger } = useTriggerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();

  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  type Status =
    | "ideal"
    | "start"
    | "queued"
    | "proccessing"
    | "failed"
    | "completed"
    | "repeat";
  const [status, setStatus] = useState<Status>("ideal");
  const [reportId, setReportId] = useState<string>("");
  const [download_url, set_download_url] = useState<string>("");

  const onClose = () => {
    setStatus("ideal");
    setReportId("");
    resetTrigger();
  };

  const exportChat = async () => {
    try {
      if (!chatId) return;

      if (dateRange.length !== 2) {
        Notification.error("Select date to export chat");
        return;
      }

      const params = {
        target_user: target_user ? target_user : undefined,
      };
      const payload = {
        resource_type: chatId?.includes("group") ? "group" : "dm",
        resource_id: decodeURIComponent(chatId),
        start_date: dateRange[0],
        end_date: dateRange[1],
      };

      const res = await api.post(ENDPOINTS.EXPORTCHAT.GENERATE, payload, {
        params,
      });

      if (res.status !== 202) {
        Notification.error("Failed to export chat");
        return;
      }

      setReportId(res.data?.report_id);
      setStatus(res.data?.status);
    } catch (error) {
      console.log(error);
      setStatus("ideal");
    }
  };

  const reportStatusChecker = async () => {
    try {
      if (!chatId) {
        setStatus("ideal");
        return;
      }

      if (!reportId) {
        Notification.error("Report id not available");
        setStatus("ideal");
        return;
      }

      const params = {
        target_user: target_user ? target_user : undefined,
      };

      const res = await api.get(`${ENDPOINTS.EXPORTCHAT.STATUS}/${reportId}`, {
        params,
      });

      if (res.status === 200) {
        if (status === res.data?.status) {
          setStatus("repeat");
        } else if (res.data?.status === "completed") {
          set_download_url(res.data?.url);
          setStatus(res.data?.status);
        } else {
          setStatus(res.data?.status);
        }
      }
    } catch (error) {
      setStatus("ideal");
    }
  };

  const downloadChats = async () => {
    if (!download_url) {
      throw new Error("Download url not found");
    }

    try {
      const link = document.createElement("a");
      link.href = download_url;
      link.download = "";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus("ideal");

      Notification.success("Chat exported successfully");
      setReportId("");
      set_download_url("");
      setDateRange([null, null]);
    } catch (error) {
      console.log(error);
      Notification.error("Downloading failed. Try again");
    }
  };

  const onSubmit = () => {
    switch (status) {
      case "start":
        exportChat();
        break;

      case "queued":
        setTimeout(() => {
          reportStatusChecker();
        }, 2000);
        break;

      case "proccessing":
        setTimeout(() => {
          reportStatusChecker();
        }, 2000);
        break;

      case "completed":
        downloadChats();
        break;

      case "failed":
        Notification.error("Failed to download chats");
        setStatus("ideal");
        break;

      case "repeat":
        setStatus("queued");
        break;
    }
  };

  const statusProvider = () => {
    switch (status) {
      case "start":
        return "Exporting chat...";
      case "queued":
        return "Preparing for download...";
      case "proccessing":
        return "Processing to download...";
      case "repeat":
        return "Preparing for download...";

      default:
        return "Submit";
    }
  };

  useEffect(() => {
    onSubmit();
  }, [status]);

  return (
    <Modal
      opened={trigger === TRIGGERS.exportChatModal}
      onClose={onClose}
      title="Export Chat"
    >
      <Fieldset legend="Generate report">
        <DatePickerInput
          type="range"
          label="Pick dates range"
          placeholder="Pick dates range"
          value={dateRange}
          onChange={setDateRange}
          maxDate={dayjs().toDate()}
          clearable
        />

        <Group justify="flex-end" mt="md">
          <Button
            leftSection={
              !["ideal", "failed"].includes(status) && (
                <Loader color="white" size={15} />
              )
            }
            onClick={() => setStatus("start")}
          >
            {statusProvider()}
          </Button>
        </Group>
      </Fieldset>
    </Modal>
  );
}

export default ExportChatModal;
