import { create } from "zustand";

interface TRIGGERSTORE {
    trigger: string,
    setTrigger: (toTrigger: string) => void,
    resetTrigger: () => void
}

export const useTriggerStore = create<TRIGGERSTORE>((set) => ({
    trigger: "",

    setTrigger: (toTrigger) => set({ trigger: toTrigger }),
    resetTrigger: () => set({ trigger: "" })
}))