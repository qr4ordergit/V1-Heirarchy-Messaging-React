import { create } from "zustand";

interface TAGS_WITH_CATEGORY {
  user?: string[],
  group?: string[],
}
interface TAGS_STORE {
  tags: string[];
  tagsWithCategories: TAGS_WITH_CATEGORY,
  storeTags: (allTags: string[]) => void;
  storeCategoryTags: (allTags: TAGS_WITH_CATEGORY) => void;
  appendTag: (newTag: string) => void;
  removeTag: (tagToDelete: string) => void;
}

export const useTagStore = create<TAGS_STORE>((set) => ({
  tags: [],
  tagsWithCategories: {},

  storeTags: (allTags) => {
    set(() => ({
      tags: allTags,
    }));
  },

  storeCategoryTags: (allTags) => {
    set(() => ({
      tagsWithCategories: allTags,
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