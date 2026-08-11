export const ENDPOINTS = {
  DM: {
    LIST: "/get-chat-history",
    DELETE:"/delete-chat-history"
  },
  CHAT: {
    SEND: "/message",
    GET: "/message?other_user="
  }
} as const;
