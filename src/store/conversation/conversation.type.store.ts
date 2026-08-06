import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConversationType = "dm" | "groups";

interface ConversationTypeState {
  type: ConversationType;

  setType: (type: ConversationType) => void;

  reset: () => void;
}

export const useConversationTypeStore = create<ConversationTypeState>()(
  persist(
  (set) => ({
    type: "dm",

    setType: (type) => set({ type }),

    reset: () => set({ type: "dm" }),
  }),
  {
      name: "conversation-type-storage",
    }
  )
);
