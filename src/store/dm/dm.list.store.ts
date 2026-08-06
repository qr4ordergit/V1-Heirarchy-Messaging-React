import { create } from "zustand";

export interface DM {
  _id: string;
  display_name: string;
  unread_count: number;
  last_message_timestamp: string;
}

interface DMListState {
  dms: DM[];
  search: string;

  setDMs: (dms: DM[]) => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

export const useDMListStore = create<DMListState>((set) => ({
  dms: [],
  search: "",

  setDMs: (dms) => set({ dms }),

  setSearch: (search) => set({ search }),

  reset: () =>
    set({
      dms: [],
      search: "",
    }),
}));