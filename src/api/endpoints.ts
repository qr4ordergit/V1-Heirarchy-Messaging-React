export const ENDPOINTS = {
  DM: {
    LIST: "/get-chat-history",
    DELETE:"/delete-chat-history"
  },
  GROUPS:{
    LIST : "/group/chat-history"
  },
  CHAT: {
    SEND: "/message",
    GET: "/message?other_user=",
    DELETE: "/message",
    PUT: "/message"
  }
} as const;
