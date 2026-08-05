import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react";

export const Notification = {
  success: (message: string, title = "Success") => {
    notifications.show({
      title,
      message,
      color: "green",
      icon: <IconCheck size={18} />,
    });
  },

  error: (message: string, title = "Error") => {
    notifications.show({
      title,
      message,
      color: "red",
      icon: <IconX size={18} />,
    });
  },

  info: (message: string, title = "Info") => {
    notifications.show({
      title,
      message,
      color: "blue",
      icon: <IconInfoCircle size={18} />,
    });
  },
};