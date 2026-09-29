import { create } from "zustand"

interface KEYS {
    [key: string]: string
}

interface INSERT_PAYLOAD {
    id: string
    key: string
}

interface STORE {
    keys: KEYS
    insertKey: (payload: INSERT_PAYLOAD) => void
}

const useKeyStore = create<STORE>((set) => ({
    keys: {},
    insertKey: (payload) => set((state) => ({
        keys: {
            ...state.keys,
            [payload.id]: payload.key
        }
    }))
}))

export default useKeyStore