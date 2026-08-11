import { create } from "zustand";
import type { MESSAGE } from "../chats/chats.store";
interface PAYLOAD {
    toTrigger: string,
    payload: MESSAGE
}
interface TRIGGERSTORE {
    trigger: string,
    triggerPayload: MESSAGE | null,
    setTrigger: (payload: PAYLOAD) => void,
    resetTrigger: () => void
}

export const useTriggerStore = create<TRIGGERSTORE>((set) => ({
    trigger: "",
    triggerPayload: null,

    setTrigger: (payload) => set({ trigger: payload.toTrigger, triggerPayload: payload.payload }),
    resetTrigger: () => set({ trigger: "", triggerPayload: null })
}))