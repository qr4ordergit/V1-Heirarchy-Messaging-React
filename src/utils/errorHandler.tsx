import { createElement } from "react";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

export const handleApiError = (
  error: any,
  fallbackMessage: string = "Validation failed.",
): void => {
  const backendData = error?.response?.data;

  const message =
    backendData?.message ||
    backendData?.error ||
    (typeof backendData === "string" ? backendData : null) ||
    error?.message ||
    fallbackMessage;

  notifications.show({
    title: "",
    message: typeof message === "string" ? message : JSON.stringify(message),
    color: "red",
    icon: createElement(IconX, { size: 18 }),
  });
};
