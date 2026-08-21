export const ENDPOINTS = {
  DM: {
    LIST: "/get-chat-history",
    DELETE: "/delete-chat-history"
  },
  GROUPS: {
    LIST: "/group/chat-history",
    LEAVE: "/group/manage-members"
  },
  CHAT: {
    SEND: "/message",
    GET: "/message?other_user=",
    DELETE: "/message",
    PUT: "/message"
  },
  ACCESS_PERMISSION:{
    GET : "/user-access/sub-users-permissions",
    PATCH : "/user-access"
  },
  PERMISSION:{
    GET : "/permissions",
    PATCH : "/permissions"
  },
  GROUP_CHAT: {
    GET: "/groups-message?group_id=",
    POST: "/groups-message",
    DELETE: "/groups-message",
    PUT: "/groups-message",
  },
  TAGS: {
    POST: "/tags/manage",
    GET: "/tags/manage"
  }
} as const;
