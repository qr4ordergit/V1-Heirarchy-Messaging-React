import { create } from "zustand";

export interface DM {
  _id: string;
  display_name: string;
  unread_count: number;
  last_message_timestamp: string;
}

interface DMListState {
  dms: DM[];

  setDMs: (dms: DM[]) => void;
  reset: () => void;
}

export const useDMListStore = create<DMListState>((set) => ({
  dms: [],

  setDMs: (dms) => set({ dms }),


  reset: () =>
    set({
      dms: [],
    }),
}));