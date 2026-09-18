import { create } from "zustand";

interface DISAPPEAR_MODE {
  duration: number;
  enabled: boolean
}
export interface DM {
  _id: string;
  display_name: string;
  unread_count: number;
  last_message_timestamp: string;
  profile_url?: string | null;
  disappearing_messages?: DISAPPEAR_MODE | null
}

interface DISAPPEAR_MODE_PAYLOAD {
  _id: string,
  enabled: boolean,
  duration?: number
}

interface DMListState {
  dms: DM[];

  setDMs: (dms: DM[]) => void;
  reset: () => void;
  updateDmDisappearingMode: (payload: DISAPPEAR_MODE_PAYLOAD) => void
}

export const useDMListStore = create<DMListState>((set) => ({
  dms: [],

  setDMs: (dms) => set({ dms }),

  updateDmDisappearingMode: (payload) => {
    set((state) => (
      {
        dms: state.dms.map((dm) => {
          if (dm._id === payload._id) {
            return {
              ...dm,
              disappearing_messages: {
                duration: payload.duration ? payload.duration : 0,
                enabled: payload.enabled
              }
            }
          }
          return dm
        })
      }
    ))
  },

  reset: () =>
    set({
      dms: [],
    }),
}));