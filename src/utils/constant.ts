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
  AUTH_SUB_USERS_BULK: `${API_BASE_URL}/auth/sub-users/bulk-registration`,
  USER_DETAILS: `${API_BASE_URL}/user-details`,
  ACCOUNTS_LIST: `${API_BASE_URL}/user-access/sub-users-detail`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  CONTACTS: `${API_BASE_URL}/contacts`,
  VERIFY_USER: `${API_BASE_URL}/contacts/verify-user`,
  ADJACENCY_LIST: `${API_BASE_URL}/user-access/sub-users`,
  START_CONVERSATION: `${API_BASE_URL}/start-conversation`,
  PERMISSIONS: `${API_BASE_URL}/permissions`,
  MANAGE_MEMBERS: `${API_BASE_URL}/group/manage-members`,
  CREATE_INVITE_LINK: `${API_BASE_URL}/invites`,
  TAGS: `${API_BASE_URL}/tags`,
  USER_ACCESS: `${API_BASE_URL}/user-access`,
  CREATE_GROUP: `${API_BASE_URL}/group`,
  SECONDARY_USER_PASSWORD_CHANGE: `${API_BASE_URL}/auth/secondary-user-password-reset`,
  USER_HOME: `${API_BASE_URL}/user-home`,
  USER_HOME_PASSKEY: `${API_BASE_URL}/user-home/passkey`,
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
  isPrivate: "secret_007:isPrivate",
  privateMessageModal: "secret_007:privateMessageModal",
  privatePayload: "privatePayload",
  privateMessageSender: "privateMessageSender",
  decryptPrivateMsgDialog: "decryptPrivateMsgDialog",
};

export const CIPHER_SECRET =
  "a3f9c81e2d4b7f60918c5e3a2b7d4f9c1e6a8b3d5f2c9e4a7b1d8f3c6e9a2b5d";

const COMMON_PERMISSION = {
  chat: {
    start: false,
    "history-get": false,
    "history-delete": false,
  },
  "direct-messages": {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  groups: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  "group-messages": {
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
  tags: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
};

export const USER_PERMISSIONS = {
  ...COMMON_PERMISSION,
  "user-account": {
    "reset-password": false,
    "reset-username-passkey": false,
    "profile-update": false,
  },
};

export const USER_TO_USER_PERMISSIONS = {
  ...COMMON_PERMISSION,
  "sub-users": {
    update: false,
    "permission-update": false,
    "reset-password": false,
    "reset-username-passkey": false,
  },
  "users-accesstree": {
    update: false,
  },
};

export const PERMISSION_LABELS: Record<string, string> = {
  // Manage Chats
  "chat.start": "Initiate Chat",
  "chat.history-get": "View Chats",
  "chat.history-delete": "Delete Chats",

  // Direct Messages (DM)
  "direct-messages.create": "Write",
  "direct-messages.read": "View",
  "direct-messages.update": "Update",
  "direct-messages.delete": "Delete",

  // Manage Groups
  "groups.create": "Create",
  "groups.read": "View",
  "groups.update": "Update",
  "groups.delete": "Delete",

  // Group Messages
  "group-messages.create": "Write",
  "group-messages.read": "View",
  "group-messages.update": "Update",
  "group-messages.delete": "Delete",

  // Manage Contacts
  "contacts.create": "Add",
  "contacts.read": "View",
  "contacts.update": "Update",
  "contacts.delete": "Delete",

  // Manage Tags
  "tags.create": "Create",
  "tags.read": "View",
  "tags.update": "Update",
  "tags.delete": "Delete",

  // Manage Subuser
  "sub-users.create": "Create",
  "sub-users.read": "View",
  "sub-users.update": "Update Profile",
  "sub-users.delete": "Delete",
  "sub-users.permission-update": "Update Permission",
  "sub-users.reset-password": "Reset Password",
  "sub-users.reset-username-passkey": "Set Username Passkey",

  // Manage Subuser Access & Permissions
  "users-accesstree.read": "View",
  "users-accesstree.update": "Update",

  // Manage Account
  "user-account.reset-password": "Reset Password",
  "user-account.reset-username-passkey": "Set Username Passkey",
  "user-account.profile-update": "Profile Update",
};

export const COMMON_PERMISSION_GROUP_LABELS: Record<string, string> = {
  chat: "Manage Chats",
  "direct-messages": "Direct Messages (DM)",
  groups: "Manage Groups",
  "group-messages": "Group Messages",
  keyring: "Manage Keyring",
  contacts: "Manage Contacts",
  tags: "Manage Tags",
  "sub-users": "Manage Subuser",
  "users-accesstree" : "Manage Subuser Access & Permissions",
  "user-account": "Manage Account",
};

// export const USER_PERMISSION_GROUP_LABELS: Record<string, string> = {
//   ...COMMON_PERMISSION_GROUP_LABELS,
// };

// export const USER_TO_USER_PERMISSION_GROUP_LABELS: Record<string, string> = {
//   ...COMMON_PERMISSION_GROUP_LABELS,
// };

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
