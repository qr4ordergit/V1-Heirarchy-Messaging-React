import { create } from "zustand";

export interface Groups {
  _id: string;
  group_name: string;
  profile_url?: string | null;
  only_admins_can_message : boolean;
  unread_count: number;
  last_message:string
  admins:string[]
}

interface GroupListState {
  groups: Groups[];
  setGroups: (groups: Groups[]) => void;
  reset: () => void;
}

export const useGroupListStore = create<GroupListState>((set) => ({
  groups: [],
  setGroups: (groups) => set({ groups }),

  reset: () =>
    set({
      groups: [],
    }),
}));
