import { create } from "zustand";

export interface MESSAGE_MEDIA {
    media_url: string | File,
    media_details: {
        file_name: string,
        total_size: number,
        duration?: number,
        type: string,
        isDecrypted?: boolean,
        isEncrypted: true
    }
}
export interface MESSAGE {
    _id?: string;
    created_by?: string;
    created_on?: string;
    replied_to?: string;
    body?: {
        text?: string;
        media_url?: File[];
        media?: MESSAGE_MEDIA[]
    };
    tag?: string,
    users?: string[],
    password?: string,
    double_encryption?: boolean,

    [key: string]: unknown;
}

interface TAG_STATUS_PAYLOAD {
    message_ids: string[],
    status: boolean
}

interface LOCKED_ITEM {
    keyring_category_id?: string;
    pass_label?: string;
}

type IS_LOCKED = Record<string, LOCKED_ITEM> | null;

interface CURRENT_CHAT {
    media_encryption?: boolean,
    profile_url?: string | null,
    disappearing_messages?: {
        duration?: number,
        enabled?: boolean,
        updated_at?: string
    } | null
    display_name?: string,
    admins?: string[],
    is_locked?: IS_LOCKED;

    [key: string]: unknown
}

interface MODIFY_CURRENT_CHAT {
    key: string,
    value: unknown
}

interface APPEND_CHAT_PAYLOAD {
    messages: MESSAGE[],
    direction?: string
}

interface ChatsStore {
    chats: MESSAGE[];
    ogChats: MESSAGE[];
    current_chat: CURRENT_CHAT;
    addChats: (messages: MESSAGE[]) => void;
    appendChats: (payload: APPEND_CHAT_PAYLOAD) => void;
    popChat: (message_id: string) => void;
    alterChat: (message_id: string, newMessage: string) => void;
    updateTagStatus: (payload: TAG_STATUS_PAYLOAD) => void,
    filterChatsByText: (text: string) => void,
    emptyOGList: () => void,
    emptyChatList: () => void,
    updateDecryptedMsg: (msg: MESSAGE) => void,
    decryptMediaUrlOfChat: (message_id: string, newUrl: File, mediaIndex: number) => void,
    enableDecryptedMediaOfChat: (message_id: string, mediaIndex: number) => void
    insertCurrentChat: (payload: CURRENT_CHAT) => void,
    modifyCurrentChat: (payload: MODIFY_CURRENT_CHAT) => void
}

export const useChatStore = create<ChatsStore>((set) => ({
    chats: [],
    ogChats: [],
    current_chat: {},

    addChats: (messages) => {
        const alteredChats = [...messages].reverse();

        set(() => ({
            chats: alteredChats,
        }));
    },
    appendChats: (payload) => {
        const alteredChats = [...payload.messages].reverse();

        set((state) => ({
            chats: payload?.direction === "up" ? [...alteredChats, ...state.chats] : [...state.chats, ...alteredChats]
        }));
    },
    popChat: (message_id) => {
        set((state) => ({
            chats: state.chats.filter((chat) => chat._id !== message_id)
        }))
    },
    alterChat: (message_id, newMessage) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (chat._id === message_id) {
                    chat.body = {
                        text: newMessage
                    }
                }

                return chat
            })
        }))
    },
    updateTagStatus: (payload) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (payload.message_ids.includes(chat._id ?? "")) {
                    chat.is_tagged = payload.status
                }
                return chat
            })
        }))
    },
    filterChatsByText: (text) => {

        set((state) => {
            if (state.ogChats.length < 1 && text.length > 0) {
                state.ogChats = state.chats
            }
            if (state.ogChats.length === 0) {
                return {}
            }


            return {
                chats: state.ogChats.filter((chat) => chat.body?.text?.toLowerCase()?.includes(text.toLowerCase()))
            }
        })
    },
    emptyOGList: () => {
        set(() => ({
            ogChats: []
        }))
    },
    emptyChatList: () => {
        set(() => ({
            chats: []
        }))
    },
    updateDecryptedMsg: (msg) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (chat._id === msg._id) {
                    return msg
                }

                return chat
            })
        }))
    },
    decryptMediaUrlOfChat: (message_id, newUrl, mediaIndex) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (!chat.body?.media) return chat

                if (chat._id === message_id) {
                    chat.body.media[mediaIndex].media_url = newUrl
                    chat.body.media[mediaIndex].media_details.isDecrypted = true
                }

                return chat
            })
        }))
    },
    enableDecryptedMediaOfChat: (message_id, mediaIndex) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (!chat.body?.media) return chat

                if (chat._id === message_id) {
                    chat.body.media[mediaIndex].media_details.isDecrypted = true
                }

                return chat
            })
        }))
    },
    insertCurrentChat: (payload) => {
        set({
            current_chat: payload
        })
    },
    modifyCurrentChat: (payload) => {
        set((state) => ({
            current_chat: {
                ...state.current_chat,
                [payload.key]: payload.value
            }
        }))
    }

}));