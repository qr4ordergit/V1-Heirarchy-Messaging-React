export const ENDPOINTS = {
  DM: {
    LIST: "/get-chat-history",
    DELETE: "/delete-chat-history"
  },
  GROUPS: {
    LIST: "/group/chat-history",
    LEAVE : "/group/manage-members"
  },
  CHAT: {
    SEND: "/message",
    GET: "/message?other_user=",
    DELETE: "/message",
    PUT: "/message"
  },
  GROUP_CHAT: {
    GET: "/groups-message?group_id=",
    POST: "/groups-message",
    DELETE: "/groups-message",
    PUT: "/groups-message",
  }
} as const;
