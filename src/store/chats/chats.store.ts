import { create } from "zustand";

export interface MESSAGE {
    _id: string;
    created_by: string;
    created_on: string;
    body?: {
        text?: string;
    };

    [key: string]: unknown;
}

interface ChatsStore {
    chats: MESSAGE[];
    addChats: (messages: MESSAGE[]) => void;
    appendChats: (messages: MESSAGE[]) => void;
}

export const useChatStore = create<ChatsStore>((set) => ({
    chats: [],

    addChats: (messages) => {
        const alteredChats = messages.reverse();

        set(() => ({
            chats: alteredChats,
        }));
    },
    appendChats: (messages) => {
        const alteredChats = messages.reverse();

        set((state) => ({
            chats: [...state.chats, ...alteredChats],
        }));
    },
}));