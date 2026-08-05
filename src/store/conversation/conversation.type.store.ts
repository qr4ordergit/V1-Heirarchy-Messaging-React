import { create } from "zustand";

export type ConversationType = "dm" | "groups";

interface ConversationTypeState {
  type: ConversationType;

  setType: (type: ConversationType) => void;

  reset: () => void;
}

export const useConversationTypeStore = create<ConversationTypeState>(
  (set) => ({
    type: "dm",

    setType: (type) => set({ type }),

    reset: () => set({ type: "dm" }),
  }),
);
