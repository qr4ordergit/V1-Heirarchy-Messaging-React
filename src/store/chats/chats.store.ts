import { create } from "zustand";

export interface MESSAGE {
    _id: string;
    created_by: string;
    created_on: string;
    replied_to?: string;
    body?: {
        text?: string;
        media_url?: string[];
    };

    [key: string]: unknown;
}

interface ChatsStore {
    chats: MESSAGE[];
    addChats: (messages: MESSAGE[]) => void;
    appendChats: (messages: MESSAGE[]) => void;
    popChat: (message_id: string) => void;
    alterChat: (message_id: string, newMessage: string) => void
}

export const useChatStore = create<ChatsStore>((set) => ({
    chats: [],

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
    }

}));