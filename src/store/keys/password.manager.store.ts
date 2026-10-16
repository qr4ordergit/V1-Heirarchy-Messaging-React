import { create } from "zustand"

export interface KEYRINGPASSWORD {
    _id: string,
    keyring_category_name: string,
    keyring_category_passwords: {
        [key: string]: string
    }
}

interface ASSIGNEDKEYRINGPASSWORD {
    [key: string]: {
        [key: string]: string
    }
}

interface ASSIGNEDKEYRINGPASSWORDPAYLOAD {
    id: string,
    payload: {
        [key: string]: string
    }
}

interface STORE {
    keyringPasswords: KEYRINGPASSWORD[]
    assignedKeyringPasswords: ASSIGNEDKEYRINGPASSWORD
    storeKeyringPasswords: (passwords: KEYRINGPASSWORD[]) => void
    updateKeyRingPassword: (payload: KEYRINGPASSWORD) => void
    insertAssignedKeyringPassword: (payload: ASSIGNEDKEYRINGPASSWORDPAYLOAD) => void
}

const usePasswordManager = create<STORE>((set) => ({
    keyringPasswords: [],
    assignedKeyringPasswords: {},

    storeKeyringPasswords: (passwords) => {
        set({
            keyringPasswords: passwords
        })
    },

    insertAssignedKeyringPassword: (payload) => {
        set((state) => ({
            assignedKeyringPasswords: {
                ...state.assignedKeyringPasswords,
                [payload.id]: payload.payload
            }
        }))
    },

    updateKeyRingPassword: (payload) => {
        set((state) => ({
            keyringPasswords: state.keyringPasswords.map((p) => {
                if (p._id === payload._id) {
                    return payload
                }
                return p
            })
        }))
    },

    resetPasswordManager: () => {
        set({
            keyringPasswords: [],
            assignedKeyringPasswords: {}
        })
    }
}))

export default usePasswordManager