import { create } from "zustand";
import { fetchAccounts, type Account } from "../../api/accountApi";

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  fetchAccounts: (force?: boolean) => Promise<void>;
  setAccounts: (accounts: Account[]) => void;
  reset: () => void;
}

let inFlightFetch: Promise<void> | null = null;

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,
  loaded: false,

  fetchAccounts: async (force = false) => {
    if (get().loaded && !force) return;

    if (inFlightFetch) {
      await inFlightFetch;
      return;
    }

    set({ loading: true, error: null });

    inFlightFetch = (async () => {
      try {
        const data = await fetchAccounts();
        set({ accounts: data, loading: false, loaded: true, error: null });
      } catch (err) {
        set({
          loading: false,
          error:
            err instanceof Error ? err.message : "Could not load accounts.",
        });
      } finally {
        inFlightFetch = null;
      }
    })();

    await inFlightFetch;
  },

  setAccounts: (accounts) => set({ accounts, loaded: true }),

  reset: () =>
    set({ accounts: [], loading: false, error: null, loaded: false }),
}));
