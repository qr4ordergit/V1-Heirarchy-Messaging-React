import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const API_BASE_URL =
  "https://u2hjtodeyl.execute-api.ap-south-1.amazonaws.com/dev/api";

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  AUTH_USERNAME_SUGGEST: `${API_BASE_URL}/auth/username-suggest`,
  AUTH_SUB_USERS: `${API_BASE_URL}/auth/sub-users`,
  USER_DETAILS: `${API_BASE_URL}/user-details`,
  ACCOUNTS_LIST: `${API_BASE_URL}/user-access/sub-users-detail`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  CONTACTS: `${API_BASE_URL}/contacts`,
  VERIFY_USER: `${API_BASE_URL}/contacts/verify-user`,
  ADJACENCY_LIST: `${API_BASE_URL}/user-access/sub-users`,
  START_CONVERSATION: `${API_BASE_URL}/start-conversation`,
  PERMISSIONS: `${API_BASE_URL}/permissions`,
  USER_ACCESS: `${API_BASE_URL}/user-access`,
  CREATE_GROUP: `${API_BASE_URL}/group`,
  SECONDARY_USER_PASSWORD_CHANGE: `${API_BASE_URL}/auth/secondary-user-password-reset`,
  USER_HOME: `${API_BASE_URL}/user-home`,
} as const;

const avatarColors = [
  "red",
  "pink",
  "grape",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
];

export function getAvatarColor(name: string) {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export const formatConversationTime = (timestamp: string) => {
  const date = dayjs.utc(timestamp).local();

  if (date.isSame(dayjs(), "day")) {
    return date.format("hh:mm A");
  }

  if (date.isSame(dayjs().subtract(1, "day"), "day")) {
    return "Yesterday";
  }

  return date.format("DD/MM/YYYY");
};

export const TRIGGERS = {
  deleteConfirmationDialouge: "deleteConfirmationDialouge",
  editChatDialog: "editChatDialog",
  reply: "reply"
}
