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
  TAGS: `${API_BASE_URL}/tags`,
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

const token = useAuthStore.getState().accessToken;

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
  tagList: "tagList",
  searchByText: "search:text",
  searchByTag: "search:tag",
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
  // Direct Message ( DM )
  "messages.chat.create": "Write",
  "messages.chat.start": "Start Chat",
  "messages.chat.read": "View",
  "messages.chat.update": "Update",
  "messages.chat.delete": "Delete ",
  "messages.chat.history.get": "View Chats",
  "messages.chat.history.delete": "Delete Chats",
  
  // Group Messages
  "messages.group.create": "Write",
  "messages.group.read": "View",
  "messages.group.update": "Update",
  "messages.group.delete": "Delete",

  // Group
  "group.create": "Create",
  "group.read": "View",
  "group.update": "Update",
  "group.delete": "Delete",

  // Contacts
  "contacts.create": "Add",
  "contacts.read": "View",
  "contacts.update": "Update",
  "contacts.delete": "Delete",

  // Users
  "users.read": "View Profile",
  "users.accesstree.read": "View Subusers",

  // Tags
  "users.tags.create": "Create",
  "users.tags.read": "View",
  "users.tags.update": "Update",
  "users.tags.delete": "Delete",
};
export const getHeaders = (): Record<string, string> => ({
  Authorization: token ?? "",
  "Content-Type": "application/json",
});

export const COUNTRY_CODES = [
  { value: "+91", label: "+91 India" },
  { value: "+1", label: "+1 USA/Canada" },
  { value: "+44", label: "+44 UK" },
  { value: "+61", label: "+61 Australia" },
  { value: "+971", label: "+971 UAE" },
  { value: "+65", label: "+65 Singapore" },
  { value: "+966", label: "+966 Saudi Arabia" },
  { value: "+49", label: "+49 Germany" },
  { value: "+33", label: "+33 France" },
  { value: "+81", label: "+81 Japan" },
  { value: "+86", label: "+86 China" },
  { value: "+27", label: "+27 South Africa" },
  { value: "+55", label: "+55 Brazil" },
  { value: "+7", label: "+7 Russia" },
  { value: "+92", label: "+92 Pakistan" },
  { value: "+880", label: "+880 Bangladesh" },
  { value: "+94", label: "+94 Sri Lanka" },
  { value: "+977", label: "+977 Nepal" },
  { value: "+63", label: "+63 Philippines" },
  { value: "+62", label: "+62 Indonesia" },
];
