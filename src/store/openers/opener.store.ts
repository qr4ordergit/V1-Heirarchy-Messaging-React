import { create } from "zustand";

interface INSERT_PAYLOAD {
    opener: string,
    payload?: {
        [key: string]: unknown
    }
}

interface OPENERS {
    [key: string]: INSERT_PAYLOAD
}

interface POP_PAYLOAD {
    opener: string
}

interface OPENERSTORE {
    openers: OPENERS,
    insertOpener: (payload: INSERT_PAYLOAD) => void,
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

    popOpener: (payload) => set((state) => {
        delete state.openers[payload.opener]
        return {
            openers: state.openers
        }
    }),

    resetOpener: () => set({
        openers: {}
    })



}))