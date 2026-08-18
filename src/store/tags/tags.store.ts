import { create } from "zustand";

interface TAGS_STORE {
    tags: string[],
    storeTags: (allTags: string[]) => void,
    appendTag: (newTag: string) => void
}

export const useTagStore = create<TAGS_STORE>((set) => ({
    tags: ["favorite", "imp", "classic", "reminder", "developer", "media"],

    storeTags: (allTags) => {
        set(() => ({
            tags: allTags
        }))
    },

    appendTag: (newTag) => {
        set((state) => ({
            tags: [...state.tags, newTag]
        }))
    }
}))