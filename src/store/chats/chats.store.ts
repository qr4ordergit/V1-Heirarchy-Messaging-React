import { create } from "zustand";

export interface MESSAGE {
    _id?: string;
    created_by?: string;
    created_on?: string;
    replied_to?: string;
    body?: {
        text?: string;
        media_url?: File[];
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

interface ChatsStore {
    chats: MESSAGE[];
    ogChats: MESSAGE[];
    addChats: (messages: MESSAGE[]) => void;
    appendChats: (messages: MESSAGE[]) => void;
    popChat: (message_id: string) => void;
    alterChat: (message_id: string, newMessage: string) => void;
    updateTagStatus: (payload: TAG_STATUS_PAYLOAD) => void,
    filterChatsByText: (text: string) => void,
    emptyOGList: () => void,
    updateDecryptedMsg: (msg: MESSAGE) => void
}

export const useChatStore = create<ChatsStore>((set) => ({
    chats: [],
    ogChats: [],

    addChats: (messages) => {
        const alteredChats = [...messages].reverse();

        set(() => ({
            chats: alteredChats,
        }));
    },
    appendChats: (messages) => {
        const alteredChats = [...messages].reverse();

        set((state) => ({
            chats: [...state.chats, ...alteredChats],
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
    updateDecryptedMsg: (msg) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (chat._id === msg._id) {
                    return msg
                }

                return chat
            })
        }))
    }

}));