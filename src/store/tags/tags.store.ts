import { create } from "zustand";

interface TAGS_STORE {
  tags: string[];
  storeTags: (allTags: string[]) => void;
  appendTag: (newTag: string) => void;
  removeTag: (tagToDelete: string) => void;
}

export const useTagStore = create<TAGS_STORE>((set) => ({
  tags: [],

  storeTags: (allTags) => {
    set(() => ({
      tags: allTags,
    }));
  },

  appendTag: (newTag) => {
    set((state) => ({
      tags: [...state.tags, newTag],
    }));
  },

  removeTag: (tagToDelete) => {
    set((state) => ({
      tags: state.tags.filter((t) => t !== tagToDelete),
    }));
  },
}));