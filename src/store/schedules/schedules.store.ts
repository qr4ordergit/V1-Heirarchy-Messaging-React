import { create } from "zustand"

type STATUS = "active" | "deactive"

export interface SCHEDULED_MESSAGE {
    _id: string
    schedule_date: string
    schedule_time: string
    repeat: string
    days: [string] | null
    status: STATUS,
    text: string,
    media_url: File[]
    [key: string]: unknown
}

interface STORE {
    messages: SCHEDULED_MESSAGE[],
    storeScheduleMsgs: (payload: SCHEDULED_MESSAGE[]) => void,
    insertScheduleMsg: (payload: SCHEDULED_MESSAGE) => void,
    updateScheduleMsg: (payload: SCHEDULED_MESSAGE) => void,
    deleteScheduleMsg: (payload: string) => void
}

export const useScheduleMsgsStore = create<STORE>((set) => ({
    messages: [],

    storeScheduleMsgs: (payload) => set({
        messages: payload
    }),
    insertScheduleMsg: (payload) => set((state) => ({
        messages: [...state.messages, payload]
    })),
    updateScheduleMsg: (payload) => set((state) => ({
        messages: state.messages.map((msg) => {
            if (msg._id === payload._id) {
                return {
                    ...msg,
                    ...payload
                }
            }
            return msg
        })
    })),
    deleteScheduleMsg: (payload) => set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== payload)
    }))

}))