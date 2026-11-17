import { create } from "zustand";

interface CONTACT {
    _id: string,
    display_name: string,
    contact_user_id: string,
    [key: string]: unknown
}

interface STORE {
    contacts: CONTACT[],
    storeContacts: (list: []) => void,
    resetContacts: () => void
}

const useContactStore = create<STORE>((set) => ({
    contacts: [],

    storeContacts: (list) => {
        set(() => ({
            contacts: list
        }))
    },

    resetContacts: () => {
        set(() => ({
            contacts: []
        }))
    }
}))

export default useContactStore