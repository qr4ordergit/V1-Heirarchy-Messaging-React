import { create } from "zustand";

interface INSERT_PAYLOAD<T = unknown> {
    opener: string;
    payload?: T;
}

interface OPENERS {
    [key: string]: INSERT_PAYLOAD
}

interface POP_PAYLOAD {
    opener: string
}

interface OPENERSTORE {
    openers: OPENERS,
    insertOpener: <T>(payload: INSERT_PAYLOAD<T>) => void,
    popOpener: (payload: POP_PAYLOAD) => void,
    resetOpener: () => void
}

export const useOpenerStore = create<OPENERSTORE>((set) => ({
    openers: {},

    insertOpener: (payload) => set((state) => (
        {
            openers: {
                ...state.openers,
                [payload.opener]: payload
            }
        }
    )),

    popOpener: (payload) =>
        set((state) => {
            const openers = { ...state.openers };
            delete openers[payload.opener];

            return { openers };
        }),

    resetOpener: () => set({
        openers: {}
    })



}))