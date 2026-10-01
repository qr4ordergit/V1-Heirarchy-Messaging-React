import { createElement } from "react";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { getTranslation } from "../store/language/language.store";

export const handleApiError = (error: any, fallbackMessage?: string): void => {
  const status = error?.response?.status;
  const backendData = error?.response?.data;

  let message: string;

  if (status === 403) {
    message = getTranslation(
      "commonKey.permissionDenied",
      "Permission Denied.",
    );
  } else {
    message =
      backendData?.message ||
      // backendData?.error ||
      // (typeof backendData === "string" ? backendData : null) ||
      // error?.message ||
      fallbackMessage ||
      getTranslation(
        "commonKey.somethingWentWrong",
        "Unable to complete the request. Please try again.",
      );
  }

  notifications.show({
    title: "",
    message: typeof message === "string" ? message : JSON.stringify(message),
    color: "red",
    icon: createElement(IconX, { size: 18 }),
  });
};
