export const ENDPOINTS = {
  DM: {
    LIST: "/get-chat-history",
  },
  CHAT: {
    SEND: "/message",
    GET: "/message?other_user="
  }
} as const;
