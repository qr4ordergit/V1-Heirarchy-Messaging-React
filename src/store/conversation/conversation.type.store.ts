import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConversationType = "dm" | "groups";

interface ConversationTypeState {
  type: ConversationType;
  search: string;

  setType: (type: ConversationType) => void;
  setSearch: (search: string) => void;

  reset: () => void;
}

export const useConversationTypeStore = create<ConversationTypeState>()(
  persist(
    (set) => ({
      type: "dm",
      search: "",

      setType: (type) => set({ type }),
      setSearch: (search) => set({ search }),

      reset: () => set({ type: "dm", search: "" }),
    }),
    {
      name: "conversation-type-storage",
    },
  ),
);
