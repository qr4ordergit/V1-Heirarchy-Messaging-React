import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useAuthStore } from "../store/auth/auth.store";

dayjs.extend(utc);
dayjs.extend(timezone);

export const APP_THEME = {
  background: {
    purple: "#565988",
    dark: "#2a2b35",
    gradient:
      "radial-gradient(ellipse 1000px 520px at 0px 100%, #3f405b 0%, rgba(63, 64, 91, 0) 100%), linear-gradient(153deg, transparent 47.5%, #2a2b35 47.5%), linear-gradient(200deg, #696caa 0%, #5f6299 13%, #5a5d90 21%, #565988 38%, #52547f 70%, #494b6f 82%, #3f405b 93%, #3b3c56 100%)",
  },

  surfaceLight: "rgba(190, 190, 190, 0.28)",
  surfaceLightHover: "rgba(190, 190, 190, 0.36)",

  surfaceGlass: "rgba(74, 74, 74, 0.5)",

  surfacePanel: "rgba(74, 74, 74, 0.45)",

  surfaceDark: "rgba(52, 52, 66, 0.95)",

  surfaceDarker: "rgba(40, 40, 44, 0.6)",

  surfaceFrame: "rgba(255, 255, 255, 0.03)",

  borderLight: "rgba(255, 255, 255, 0.28)",
  highlight: "rgba(255, 255, 255, 0.18)",
  textPrimary: "#ffffff",
  textSecondary: "#e3e5ee",
  accent: "#4f8cff",
} as const;

export const applyAppTheme = (): void => {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  root.setProperty("--app-background", APP_THEME.background.gradient);
  root.setProperty("--app-background-purple", APP_THEME.background.purple);
  root.setProperty("--app-background-dark", APP_THEME.background.dark);
  root.setProperty("--app-surface-glass", APP_THEME.surfaceGlass);
  root.setProperty("--app-border-light", APP_THEME.borderLight);
  root.setProperty("--app-surface-frame", APP_THEME.surfaceFrame);
  root.setProperty("--app-surface-dark", APP_THEME.surfaceDark);
  root.setProperty("--app-surface-darker", APP_THEME.surfaceDarker);
  root.setProperty("--app-surface-panel", APP_THEME.surfacePanel);
  root.setProperty("--app-surface-light", APP_THEME.surfaceLight);
  root.setProperty("--app-surface-light-hover", APP_THEME.surfaceLightHover);
  root.setProperty("--app-highlight", APP_THEME.highlight);
  root.setProperty("--app-text-primary", APP_THEME.textPrimary);
  root.setProperty("--app-text-secondary", APP_THEME.textSecondary);
  root.setProperty("--app-accent", APP_THEME.accent);
};

export const API_BASE_URL =
  "https://53mxdgl1ok.execute-api.eu-central-1.amazonaws.com/dev/api";
export const API_BASE_URL2 =
  "https://53mxdgl1ok.execute-api.eu-central-1.amazonaws.com/dev/admin";

export const SKIN_LANGUAGE_URL =
  "https://messaging-service-media-eu.s3.eu-central-1.amazonaws.com/skin-languages/messagingApp_skinLanguage_web.txt";

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  AUTH_USERNAME_SUGGEST: `${API_BASE_URL}/auth/username-suggest`,
  AUTH_SUB_USERS: `${API_BASE_URL}/auth/sub-users`,
  AUTH_SUB_USERS_BULK: `${API_BASE_URL}/auth/sub-users/bulk-registration`,
  USER_DETAILS: `${API_BASE_URL}/user-details`,
  ACCOUNTS_LIST: `${API_BASE_URL}/user-access/sub-users-detail`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_USER_SESSION: `${API_BASE_URL}/auth/user-session`,
  CONTACTS: `${API_BASE_URL}/contacts`,
  VERIFY_USER: `${API_BASE_URL}/contacts/verify-user`,
  ADJACENCY_LIST: `${API_BASE_URL}/user-access/sub-users`,
  START_CONVERSATION: `${API_BASE_URL}/start-conversation`,
  PERMISSIONS: `${API_BASE_URL}/permissions`,
  MANAGE_MEMBERS: `${API_BASE_URL}/group/manage-members`,
  CREATE_INVITE_LINK: `${API_BASE_URL}/invites`,
  TAGS: `${API_BASE_URL}/tags`,
  ACCOUNT_PACKAGES: `${API_BASE_URL}/account-packages`,
  USER_ACCESS: `${API_BASE_URL}/user-access`,
  CREATE_GROUP: `${API_BASE_URL}/group`,
  SECONDARY_USER_PASSWORD_CHANGE: `${API_BASE_URL}/auth/secondary-user-password-reset`,
  USER_HOME: `${API_BASE_URL}/user-home`,
  USER_HOME_PASSKEY: `${API_BASE_URL}/user-home/passkey`,
  AUTH_GET_NEW_TOKEN: `${API_BASE_URL}/auth/get_new_token`,
  KEYRING_CATEGORIES: `${API_BASE_URL}/keyring-categories`,
  USAGE: `${API_BASE_URL}/usage`,
  ESTIMATE: `${API_BASE_URL}/estimate`,
  INVOICES: `${API_BASE_URL}/invoices`,
  ADMIN_PRICING: `${API_BASE_URL2}/pricing`,
  OVERVIEW: `${API_BASE_URL2}/overview`,
  ACTIVATE_USER: `${API_BASE_URL2}/activate`,
  DEACTIVATE_USER: `${API_BASE_URL2}/deactivate`,
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
  exportChatModal: "exportChatModal",
  disappearChatModal: "disappearChatModal",
  schedulePayload: "schedule:schedulePayload",
  chatPasswordModal: "chatPasswordModal",
  chatPasswordPayload: "chatPasswordPayload",
  groupInfoModal: "groupInfoModal",
};

export const OPENERS = {
  schedulerList: "schedulerList",
  editScheduledMsg: "editScheduledMsg",
  doubleEncryption_init: "doubleEncryption_init",
  groupInfoModal: "groupInfoModal",
};

export const CIPHER_SECRET =
  "a3f9c81e2d4b7f60918c5e3a2b7d4f9c1e6a8b3d5f2c9e4a7b1d8f3c6e9a2b5d";

const COMMON_PERMISSION = {
  chat: {
    "history-get": false,
    start: false,
    "history-delete": false,
  },
  "direct-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
    "manual-password": false,
    DMchat_lock: false,
    DMchat_unlock: false,
  },
  groups: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "group-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
    "manual-password": false,
    groupchat_lock: false,
    groupchat_unlock: false,
  },
  "media-encryption": {
    active: false,
  },
  contacts: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  tags: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
};

export const USER_PERMISSIONS = {
  ...COMMON_PERMISSION,
  "keyring-categories": {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "scheduled-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "disappearing-messages": {
    create: false,
  },
  "chat-export": {
    read: false,
    create: false,
  },
  "user-account": {
    "reset-password": false,
    "reset-username-passkey": false,
    "profile-update": false,
  },
};

export const USER_TO_USER_PERMISSIONS = {
  ...COMMON_PERMISSION,
  "keyring-categories": {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "shared-keyring-category": {
    read: false,
  },
  "scheduled-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "disappearing-messages": {
    create: false,
  },
  "chat-export": {
    read: false,
    create: false,
  },
  "sub-users": {
    update: false,
    "permission-update": false,
    "reset-password": false,
    "reset-username-passkey": false,
  },
  "users-accesstree": {
    read: false,
    update: false,
  },
};

export const BOT_COMMON_PERMISSION = {
  chat: {
    "history-get": false,
    start: false,
    "history-delete": false,
  },
  "direct-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
    "manual-password": false,
    DMchat_lock: false,
    DMchat_unlock: false,
  },
  "bot-messages": {
    read: false,
  },
  groups: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "group-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
    "manual-password": false,
    groupchat_lock: false,
    groupchat_unlock: false,
  },
  "media-encryption": {
    active: false,
  },
  "keyring-categories": {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
};

export const BOT_USER_PERMISSIONS = {
  ...BOT_COMMON_PERMISSION,
  contacts: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  tags: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "user-account": {
    "reset-password": false,
    "reset-username-passkey": false,
    "profile-update": false,
  },
  "chat-export": {
    read: false,
    create: false,
  },
  "scheduled-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "disappearing-messages": {
    create: false,
  },
};

export const BOT_USER_TO_USER_PERMISSIONS = {
  ...BOT_COMMON_PERMISSION,
  "shared-keyring-category": {
    read: false,
  },
  contacts: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  tags: {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "chat-export": {
    read: false,
    create: false,
  },
  "scheduled-messages": {
    read: false,
    create: false,
    update: false,
    delete: false,
  },
  "disappearing-messages": {
    create: false,
  },
};

export const PERMISSION_LABELS: Record<string, string> = {
  // Manage Chats
  "chat|start": "Initiate Chat",
  "chat|history-get": "View Chats",
  "chat|history-delete": "Delete Chats",

  // Direct Messages (DM)
  "direct-messages|create": "Write",
  "direct-messages|read": "View",
  "direct-messages|update": "Update",
  "direct-messages|delete": "Delete",
  "direct-messages|manual-password": "Allow Manual Password",
  "direct-messages|DMchat_lock": "DM Chat Lock",
  "direct-messages|DMchat_unlock": "DM Chat Unlock",

  // Manage Groups
  "groups|create": "Create",
  "groups|read": "View",
  "groups|update": "Update",
  "groups|delete": "Delete",

  // Group Messages
  "group-messages|create": "Write",
  "group-messages|read": "View",
  "group-messages|update": "Update",
  "group-messages|delete": "Delete",
  "group-messages|manual-password": "Allow Manual Password",
  "group-messages|groupchat_lock": "Group Chat Lock",
  "group-messages|groupchat_unlock": "Group Chat Unlock",

  // Media Encryption
  "media-encryption|active": "Allow",

  // Manage Contacts
  "contacts|create": "Add",
  "contacts|read": "View",
  "contacts|update": "Update",
  "contacts|delete": "Delete",

  // Manage Tags
  "tags|create": "Create",
  "tags|read": "View",
  "tags|update": "Update",
  "tags|delete": "Delete",

  // Keyring Categories
  "keyring-categories|read": "View",
  "keyring-categories|create": "Create",
  "keyring-categories|update": "Update",
  "keyring-categories|delete": "Delete",

  // Shared Keyring Category
  "shared-keyring-category|read": "View",

  // Scheduled Messages
  "scheduled-messages|read": "View",
  "scheduled-messages|create": "Allow",
  "scheduled-messages|update": "Update",
  "scheduled-messages|delete": "Delete",

  // Disappearing Messages
  "disappearing-messages|create": "Allow",

  // Export Chats
  "chat-export|read": "View",
  "chat-export|create": "Allow",

  // Manage Subuser
  "sub-users|create": "Create",
  "sub-users|read": "View",
  "sub-users|update": "Update Profile",
  "sub-users|delete": "Delete",
  "sub-users|permission-update": "Access & Permissions",
  "sub-users|reset-password": "Reset Password",
  "sub-users|reset-username-passkey": "Set Username Passkey",

  // Manage Account
  "user-account|reset-password": "Reset Password",
  "user-account|reset-username-passkey": "Set Username Passkey",
  "user-account|profile-update": "Profile Update",

  // Manage Subuser Access & Permissions
  "users-accesstree|read": "View",
  "users-accesstree|update": "Update",

  // BOT

  // Messages
  "bot-messages|read": "View",
};

export const COMMON_PERMISSION_GROUP_LABELS: Record<string, string> = {
  chat: "Manage Chats",
  "direct-messages": "Direct Messages (DM)",
  groups: "Manage Groups",
  "group-messages": "Group Messages",
  "media-encryption": "Media Encryption",
  contacts: "Manage Contacts",
  tags: "Manage Tags",
  "keyring-categories": "Keyring Categories",
  "shared-keyring-category": "Shared Keyring Category",
  "scheduled-messages": "Scheduled Messages",
  "disappearing-messages": "Disappearing Messages",
  "chat-export": "Export Chats",
  "sub-users": "Manage Subuser Account",
  "user-account": "Manage Account",
  "users-accesstree": "Manage Subuser's Accessed Accounts Access & Permissions",

  // BOT

  "bot-messages": "Messages",
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
