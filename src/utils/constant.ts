import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useAuthStore } from "../store/auth/auth.store";

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
  MANAGE_MEMBERS: `${API_BASE_URL}/group/manage-members`,
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

export const withTargetUser = (path: string) => {
  const targetUser = useAuthStore.getState().target_user;

  if (targetUser === "") {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}target_user=${targetUser}`;
};

export const TRIGGERS = {
  deleteConfirmationDialouge: "deleteConfirmationDialouge",
  editChatDialog: "editChatDialog",
  reply: "reply",
  refreshChat: "refresh_chat",
  previewMedia: "preview_media",
};

export const CIPHER_SECRET =
  "a3f9c81e2d4b7f60918c5e3a2b7d4f9c1e6a8b3d5f2c9e4a7b1d8f3c6e9a2b5d";

export const PERMISSIONS = {
  messages: {
    chat: {
      create: false,
      start: false,
      read: false,
      update: false,
      delete: false,
      history: {
        get: false,
        delete: false,
      },
    },
    group: {
      create: false,
      read: false,
      update: false,
      delete: false,
    },
  },

  group: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },

  contacts: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },

  users: {
    read: false,
    accesstree: {
      read: false,
    },
    tags: {
      create: false,
      read: false,
      update: false,
      delete: false,
    },
  },
};

export const PERMISSION_LABELS: Record<string, string> = {
  "messages.chat.create": "Write Message",
  "messages.chat.start": "Start Chat",
  "messages.chat.read": "View Messages",
  "messages.chat.update": "Update Message",
  "messages.chat.delete": "Delete Message",

  "messages.chat.history.get": "View Chats",
  "messages.chat.history.delete": "Delete Chats",

  "messages.group.create": "Write Message",
  "messages.group.read": "View Messages",
  "messages.group.update": "Update Message",
  "messages.group.delete": "Delete Message",

  "group.create": "Create Group",
  "group.read": "View Groups",
  "group.update": "Update Group",
  "group.delete": "Delete Group",

  "contacts.create": "Add Contact",
  "contacts.read": "View Contacts",
  "contacts.update": "Update Contact",
  "contacts.delete": "Delete Contact",

  "users.read": "View Profile",

  "users.accesstree.read": "View Subusers",

  "users.tags.create": "Create Tag",
  "users.tags.read": "View Tag",
  "users.tags.update": "Update Tag",
  "users.tags.delete": "Delete Tag",
};
