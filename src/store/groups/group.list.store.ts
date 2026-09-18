import { create } from "zustand";

interface DISAPPEAR_MODE {
  duration: number;
  enabled: boolean
}
export interface Groups {
  _id: string;
  group_name: string;
  profile_url?: string | null;
  only_admins_can_message: boolean;
  unread_count: number;
  last_message: string
  admins: string[]
  disappearing_messages?: DISAPPEAR_MODE | null
}

interface DISAPPEAR_MODE_PAYLOAD {
  _id: string,
  enabled: boolean,
  duration?: number
}

interface GroupListState {
  groups: Groups[];
  setGroups: (groups: Groups[]) => void;
  updateGroupDisappearingMode: (payload: DISAPPEAR_MODE_PAYLOAD) => void;
  reset: () => void;
}

export const useGroupListStore = create<GroupListState>((set) => ({
  groups: [],
  setGroups: (groups) => set({ groups }),
  updateGroupDisappearingMode: (payload) => {
    set((state) => (
      {
        groups: state.groups.map((grp) => {
          if (grp._id === payload._id) {
            return {
              ...grp,
              disappearing_messages: {
                duration: payload.duration ? payload.duration : 0,
                enabled: payload.enabled
              }
            }
          }
          return grp
        })
      }
    ))
  },
  reset: () =>
    set({
      groups: [],
    }),
}));
