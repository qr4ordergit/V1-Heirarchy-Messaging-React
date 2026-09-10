export const ENDPOINTS = {
  DM: {
    LIST: "/get-chat-history",
    DELETE: "/delete-chat-history"
  },
  GROUPS: {
    LIST: "/group/chat-history",
    LEAVE: "/group/manage-members",
    GETMEMBERS: "/group"
  },
  CHAT: {
    SEND: "/message",
    GET: "/message?other_user=",
    DELETE: "/message",
    PUT: "/message"
  },
  CHAT1: {
    SEND: "/message-v1",
    GET: "/message-v1?other_user=",
    DELETE: "/message",
    PUT: "/message"
  },
  ACCESS_PERMISSION: {
    GET: "/user-access/sub-users-permissions",
    PATCH: "/user-access"
  },
  PERMISSION: {
    GET: "/permissions",
    PATCH: "/permissions"
  },
  GROUP_CHAT: {
    GET: "/groups-message?group_id=",
    POST: "/groups-message",
    DELETE: "/groups-message",
    PUT: "/groups-message",
  },
  GROUP_CHAT1: {
    GET: "/groups-message-v1?group_id=",
    POST: "/groups-message-v1",
    DELETE: "/groups-message",
    PUT: "/groups-message",
  },
  MEDIA: {
    COMPLETE_MULTIPART: "/multi-file-merge"
  },
  TAGS_FILTER: {
    GET: "/tags/manage",
  },
  TAGS_TO_MSG: {
    POST: "/tags/manage",
    DELETE: "/tags/manage",
    EXISTING: "/tags/by_message_id",
  },
  TAG: {
    GET: "/tags"
  },
  PRIVATEMSG: {
    DECRYPT: "/groups-message/decrypt"
  },
  EXPORTCHAT: {
    GENERATE: "/message-reports",
    STATUS: "/message-reports"
  }
} as const;
