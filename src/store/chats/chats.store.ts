import { create } from "zustand";

interface Message {
    _id: string;
    created_by: string;
    created_on: string;
    body?: {
        text?: string;
    };

    [key: string]: unknown;
}

interface ChatsStore {
    chats: Message[];
    addChats: (messages: Message[]) => void;
    appendChats: (messages: Message[]) => void;
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